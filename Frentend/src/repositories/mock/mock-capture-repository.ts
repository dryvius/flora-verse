import { DEMO_USER_ID } from "@/constants/app";
import { ERROR_CODES } from "@/constants/error-codes";
import { DiscoveryType } from "@/enums/discovery-type";
import { InstanceStatus } from "@/enums/instance-status";
import { LocationMode } from "@/enums/location-mode";
import { RecognitionStatus } from "@/enums/recognition-status";
import { findSpecies } from "@/repositories/mock/mappers";
import { getMockDb, mutateMockDb } from "@/repositories/mock/store";
import type { CaptureRepository } from "@/repositories/interfaces/capture-repository";
import type { CaptureResult, CreateCapturePayload, PlantCapture } from "@/types/plant-capture";
import type { PlantInstance } from "@/types/plant-instance";
import { BusinessError } from "@/utils/business-error";
import { nowIso } from "@/utils/date";
import { createId } from "@/utils/id";

function toCaptureResult(capture: PlantCapture, instance: PlantInstance): CaptureResult {
    const species = findSpecies(getMockDb(), capture.speciesId);
    if (!species) {
        throw new BusinessError(ERROR_CODES.SPECIES_NOT_FOUND, "确认的物种不存在");
    }
    return {
        capture,
        instance: {
            id: instance.id,
            coverImageKey: instance.coverImageKey,
            capturedAt: instance.capturedAt,
        },
        species: {
            id: species.id,
            chineseName: species.chineseName,
            scientificName: species.scientificName,
            family: species.family,
            genus: species.genus,
        },
        isFirstDiscovery: capture.discoveryType === DiscoveryType.First,
    };
}

export class MockCaptureRepository implements CaptureRepository {
    async create(payload: CreateCapturePayload): Promise<CaptureResult> {
        const db = getMockDb();
        const existing = db.captures.find(
            item => item.userId === DEMO_USER_ID && item.idempotencyKey === payload.idempotencyKey,
        );
        if (existing) {
            const instance = db.instances.find(item => item.id === existing.instanceId);
            if (!instance) {
                throw new BusinessError(ERROR_CODES.INSTANCE_NOT_FOUND, "幂等收录记录缺少个体");
            }
            return toCaptureResult(existing, instance);
        }

        const species = findSpecies(db, payload.speciesId);
        if (!species) {
            throw new BusinessError(ERROR_CODES.SPECIES_NOT_FOUND, "确认的物种不存在");
        }

        const task = db.tasks.find(item => item.id === payload.recognitionTaskId);
        if (!task) {
            throw new BusinessError(ERROR_CODES.TASK_NOT_FOUND, "识别任务不存在，请重新识别");
        }
        if (task.status !== RecognitionStatus.Succeeded) {
            throw new BusinessError(ERROR_CODES.TASK_NOT_READY, "识别尚未完成，无法收录");
        }

        const capturedAt = nowIso();
        const instanceId = createId("ins");
        const captureId = createId("cap");
        const existingDiscovery = db.discoveries.find(
            item => item.userId === DEMO_USER_ID && item.speciesId === payload.speciesId,
        );
        const discoveryType = existingDiscovery ? DiscoveryType.Repeat : DiscoveryType.First;

        const instance: PlantInstance = {
            id: instanceId,
            userId: DEMO_USER_ID,
            speciesId: payload.speciesId,
            captureId,
            nickname: null,
            coverImageKey: payload.imageKey,
            note: null,
            status: InstanceStatus.Active,
            capturedAt,
            createdAt: capturedAt,
            updatedAt: capturedAt,
        };

        const capture: PlantCapture = {
            id: captureId,
            userId: DEMO_USER_ID,
            recognitionTaskId: payload.recognitionTaskId,
            speciesId: payload.speciesId,
            instanceId,
            imageKey: payload.imageKey,
            capturedAt,
            discoveryType,
            confirmationType: payload.confirmationType,
            locationMode: LocationMode.None,
            locationData: null,
            idempotencyKey: payload.idempotencyKey,
            createdAt: capturedAt,
        };

        mutateMockDb(draft => {
            draft.instances.push(instance);
            draft.captures.push(capture);
            const discovery = draft.discoveries.find(
                item => item.userId === DEMO_USER_ID && item.speciesId === payload.speciesId,
            );
            if (discovery) {
                discovery.instanceCount += 1;
                discovery.updatedAt = capturedAt;
            } else {
                draft.discoveries.push({
                    id: createId("dsc"),
                    userId: DEMO_USER_ID,
                    speciesId: payload.speciesId,
                    firstInstanceId: instanceId,
                    firstDiscoveredAt: capturedAt,
                    instanceCount: 1,
                    createdAt: capturedAt,
                    updatedAt: capturedAt,
                });
            }
        });

        return toCaptureResult(capture, instance);
    }
}
