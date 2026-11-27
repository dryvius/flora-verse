import { RECOGNITION_POLL_INTERVAL_MS, RECOGNITION_TIMEOUT_MS } from "@/constants/app";
import { ERROR_CODES } from "@/constants/error-codes";
import { RecognitionStatus } from "@/enums/recognition-status";
import { getRepositories } from "@/repositories/create-repository";
import { delay } from "@/utils/delay";
import type { ConfirmationType } from "@/enums/confirmation-type";
import type { CaptureResult } from "@/types/plant-capture";
import type { RecognitionTask } from "@/types/recognition";
import { BusinessError } from "@/utils/business-error";

let inFlightIdempotencyKey: string | null = null;

export async function startRecognition(imageKey: string): Promise<RecognitionTask> {
    return getRepositories().recognition.createTask({ imageKey });
}

export async function waitForRecognition(taskId: string): Promise<RecognitionTask> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < RECOGNITION_TIMEOUT_MS) {
        const task = await getRepositories().recognition.getTask(taskId);
        if (task.status === RecognitionStatus.Succeeded) {
            return task;
        }
        if (task.status === RecognitionStatus.Failed || task.status === RecognitionStatus.Expired) {
            throw new BusinessError(
                task.errorCode ?? ERROR_CODES.RECOGNITION_FAILED,
                task.errorMessage ?? "识别失败，请重试",
            );
        }
        await delay(RECOGNITION_POLL_INTERVAL_MS);
    }
    throw new BusinessError(ERROR_CODES.RECOGNITION_TIMEOUT, "识别超时，请稍后重试");
}

export async function confirmCapture(input: {
    recognitionTaskId: string;
    speciesId: string;
    confirmationType: ConfirmationType;
    imageKey: string;
    idempotencyKey: string;
}): Promise<CaptureResult> {
    if (inFlightIdempotencyKey === input.idempotencyKey) {
        throw new BusinessError(ERROR_CODES.CAPTURE_IN_PROGRESS, "正在提交收录，请稍候");
    }
    inFlightIdempotencyKey = input.idempotencyKey;
    try {
        return await getRepositories().capture.create(input);
    } finally {
        inFlightIdempotencyKey = null;
    }
}
