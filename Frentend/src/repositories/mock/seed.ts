import { SPECIES_COVER_PREFIX } from "@/constants/image";
import { DEMO_USER_ID } from "@/constants/app";
import { AliasType } from "@/enums/alias-type";
import { ConfirmationType } from "@/enums/confirmation-type";
import { DiscoveryType } from "@/enums/discovery-type";
import { InstanceStatus } from "@/enums/instance-status";
import { LocationMode } from "@/enums/location-mode";
import { ReviewStatus } from "@/enums/review-status";
import type { MockDatabase } from "@/repositories/mock/types";
import type { FriendExplorer } from "@/types/friend";
import type { PlantSpecies } from "@/types/plant-species";

const CREATED_AT = "2026-09-01T08:00:00.000Z";

const SPECIES_COMBAT_POWER: Record<string, number> = {
    spc_epipremnum_aureum: 120,
    spc_chlorophytum_comosum: 110,
    spc_dracaena_trifasciata: 180,
    spc_monstera_deliciosa: 260,
    spc_pachira_aquatica: 200,
    spc_aloe_vera: 150,
    spc_rosa_chinensis: 220,
    spc_hydrangea_macrophylla: 190,
    spc_osmanthus_fragrans: 240,
    spc_ginkgo_biloba: 320,
    spc_cinnamomum_camphora: 300,
    spc_lagerstroemia_indica: 210,
    spc_nelumbo_nucifera: 280,
    spc_helianthus_annuus: 170,
    spc_kalanchoe_pinnata: 140,
    spc_asparagus_setaceus: 130,
};

function coverKey(speciesId: string): string {
    return `${SPECIES_COVER_PREFIX}${speciesId}`;
}

function createSpecies(
    partial: Omit<
        PlantSpecies,
        | "taxonomySource"
        | "taxonomyVersion"
        | "reviewStatus"
        | "createdAt"
        | "updatedAt"
        | "representativeImageKey"
        | "baseCombatPower"
    >,
): PlantSpecies {
    const baseCombatPower = SPECIES_COMBAT_POWER[partial.id];
    if (baseCombatPower === undefined) {
        throw new Error(`缺少物种战斗数值: ${partial.id}`);
    }
    return {
        ...partial,
        baseCombatPower,
        representativeImageKey: coverKey(partial.id),
        taxonomySource: "floraverse-seed",
        taxonomyVersion: "2026.11",
        reviewStatus: ReviewStatus.Published,
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
    };
}

const species: PlantSpecies[] = [
    createSpecies({
        id: "spc_epipremnum_aureum",
        scientificName: "Epipremnum aureum",
        chineseName: "绿萝",
        commonNames: ["黄金葛"],
        family: "天南星科",
        genus: "麒麟叶属",
        description: "常见室内藤本观叶植物，叶片心形，耐阴，适合作为入门识别样本。",
        characteristics: {
            leafShape: "心形",
            typicalHeight: "藤蔓可延伸数米",
            notableFeatures: ["叶面常有黄绿色斑纹", "气生根明显"],
        },
    }),
    createSpecies({
        id: "spc_chlorophytum_comosum",
        scientificName: "Chlorophytum comosum",
        chineseName: "吊兰",
        commonNames: ["折鹤兰"],
        family: "天门冬科",
        genus: "吊兰属",
        description: "丛生草本，叶细长拱垂，走茎先端易长出新植株。",
        characteristics: {
            leafShape: "线状披针形",
            typicalHeight: "20-40 厘米",
            notableFeatures: ["叶缘常具白边", "悬垂走茎"],
        },
    }),
    createSpecies({
        id: "spc_dracaena_trifasciata",
        scientificName: "Dracaena trifasciata",
        chineseName: "虎皮兰",
        commonNames: ["虎尾兰"],
        family: "天门冬科",
        genus: "龙血树属",
        description: "肉质直立叶，表面有横向斑纹，耐旱，常被栽于室内。",
        characteristics: {
            leafShape: "剑形肉质叶",
            typicalHeight: "30-80 厘米",
            notableFeatures: ["叶表横纹", "极耐干旱"],
        },
    }),
    createSpecies({
        id: "spc_monstera_deliciosa",
        scientificName: "Monstera deliciosa",
        chineseName: "龟背竹",
        commonNames: ["蓬莱蕉"],
        family: "天南星科",
        genus: "龟背竹属",
        description: "大型观叶植物，成熟叶片出现羽状开裂与穿孔。",
        characteristics: {
            leafShape: "近圆形，成熟后开裂",
            typicalHeight: "室内可达 1-2 米",
            notableFeatures: ["叶窗孔", "粗壮气生根"],
        },
    }),
    createSpecies({
        id: "spc_pachira_aquatica",
        scientificName: "Pachira aquatica",
        chineseName: "发财树",
        commonNames: ["马拉巴栗"],
        family: "木棉科",
        genus: "瓜栗属",
        description: "掌状复叶，茎基部常膨大，室内常见编织主干造型。",
        characteristics: {
            leafShape: "掌状复叶",
            typicalHeight: "室内 0.5-2 米",
            notableFeatures: ["茎基膨大", "小叶 5-7 枚"],
        },
    }),
    createSpecies({
        id: "spc_aloe_vera",
        scientificName: "Aloe vera",
        chineseName: "芦荟",
        commonNames: ["库拉索芦荟"],
        family: "阿福花科",
        genus: "芦荟属",
        description: "莲座状多浆植物，叶缘有齿，叶肉肥厚。",
        characteristics: {
            leafShape: "披针形肉质叶",
            typicalHeight: "30-60 厘米",
            notableFeatures: ["叶缘锯齿", "叶肉凝胶状"],
        },
    }),
    createSpecies({
        id: "spc_rosa_chinensis",
        scientificName: "Rosa chinensis",
        chineseName: "月季",
        commonNames: ["月月红"],
        family: "蔷薇科",
        genus: "蔷薇属",
        description: "灌木花卉，花色丰富，园林与阳台常见栽培。",
        characteristics: {
            leafShape: "奇数羽状复叶",
            typicalHeight: "0.5-2 米",
            notableFeatures: ["花期长", "茎常具皮刺"],
        },
    }),
    createSpecies({
        id: "spc_hydrangea_macrophylla",
        scientificName: "Hydrangea macrophylla",
        chineseName: "绣球",
        commonNames: ["八仙花"],
        family: "绣球科",
        genus: "绣球属",
        description: "大型聚伞花序，花色随土壤酸碱度变化。",
        characteristics: {
            leafShape: "卵形对生叶",
            typicalHeight: "1-2 米",
            notableFeatures: ["球状花序", "花色可变"],
        },
    }),
    createSpecies({
        id: "spc_osmanthus_fragrans",
        scientificName: "Osmanthus fragrans",
        chineseName: "桂花",
        commonNames: ["木犀"],
        family: "木犀科",
        genus: "木犀属",
        description: "常绿小乔木或灌木，秋季开花，香气浓郁。",
        characteristics: {
            leafShape: "椭圆形革质叶",
            typicalHeight: "3-8 米",
            notableFeatures: ["秋季开花", "花香显著"],
        },
    }),
    createSpecies({
        id: "spc_ginkgo_biloba",
        scientificName: "Ginkgo biloba",
        chineseName: "银杏",
        commonNames: ["白果"],
        family: "银杏科",
        genus: "银杏属",
        description: "落叶乔木，扇形叶，秋叶金黄，行道树常见。",
        characteristics: {
            leafShape: "扇形",
            typicalHeight: "可达 20 米以上",
            notableFeatures: ["叶脉二叉", "秋季转黄"],
        },
    }),
    createSpecies({
        id: "spc_cinnamomum_camphora",
        scientificName: "Cinnamomum camphora",
        chineseName: "香樟",
        commonNames: ["樟树"],
        family: "樟科",
        genus: "樟属",
        description: "常绿乔木，揉叶有香气，城市绿化常见。",
        characteristics: {
            leafShape: "卵状椭圆形",
            typicalHeight: "可达 20 米以上",
            notableFeatures: ["叶有樟脑香", "树冠开展"],
        },
    }),
    createSpecies({
        id: "spc_lagerstroemia_indica",
        scientificName: "Lagerstroemia indica",
        chineseName: "紫薇",
        commonNames: ["百日红"],
        family: "千屈菜科",
        genus: "紫薇属",
        description: "落叶小乔木，夏季开花期长，树皮光滑。",
        characteristics: {
            leafShape: "椭圆形对生或近对生",
            typicalHeight: "3-7 米",
            notableFeatures: ["花期长", "树干光滑"],
        },
    }),
    createSpecies({
        id: "spc_nelumbo_nucifera",
        scientificName: "Nelumbo nucifera",
        chineseName: "荷花",
        commonNames: ["莲"],
        family: "莲科",
        genus: "莲属",
        description: "水生草本，叶圆盾状，夏季开花。",
        characteristics: {
            leafShape: "圆形盾状",
            typicalHeight: "挺水 0.5-1.5 米",
            notableFeatures: ["叶柄居中", "花叶同季"],
        },
    }),
    createSpecies({
        id: "spc_helianthus_annuus",
        scientificName: "Helianthus annuus",
        chineseName: "向日葵",
        commonNames: ["葵花"],
        family: "菊科",
        genus: "向日葵属",
        description: "一年生草本，头状花序大，舌状花通常金黄。",
        characteristics: {
            leafShape: "心状卵形",
            typicalHeight: "1-3 米",
            notableFeatures: ["大型头状花序", "茎直立粗糙"],
        },
    }),
    createSpecies({
        id: "spc_kalanchoe_pinnata",
        scientificName: "Kalanchoe pinnata",
        chineseName: "落地生根",
        commonNames: ["花蝴蝶"],
        family: "景天科",
        genus: "伽蓝菜属",
        description: "多浆草本，叶缘易萌生小植株，常被当作多肉观察。",
        characteristics: {
            leafShape: "羽状复叶或单叶",
            typicalHeight: "30-100 厘米",
            notableFeatures: ["叶缘不定芽", "肉质茎叶"],
        },
    }),
    createSpecies({
        id: "spc_asparagus_setaceus",
        scientificName: "Asparagus setaceus",
        chineseName: "文竹",
        commonNames: ["云片竹"],
        family: "天门冬科",
        genus: "天门冬属",
        description: "纤细观叶植物，叶状枝呈片状，姿态轻盈。",
        characteristics: {
            leafShape: "叶状枝纤细如羽毛",
            typicalHeight: "室内 30-80 厘米",
            notableFeatures: ["云片状分枝", "茎具刺或平滑"],
        },
    }),
];

export function createSeedDatabase(): MockDatabase {
    const firstPothos = {
        id: "ins_seed_pothos_1",
        userId: DEMO_USER_ID,
        speciesId: "spc_epipremnum_aureum",
        captureId: "cap_seed_pothos_1",
        nickname: null,
        coverImageKey: coverKey("spc_epipremnum_aureum"),
        note: null,
        status: InstanceStatus.Active,
        capturedAt: "2026-10-12T09:20:00.000Z",
        createdAt: "2026-10-12T09:20:00.000Z",
        updatedAt: "2026-10-12T09:20:00.000Z",
    };
    const repeatPothos = {
        id: "ins_seed_pothos_2",
        userId: DEMO_USER_ID,
        speciesId: "spc_epipremnum_aureum",
        captureId: "cap_seed_pothos_2",
        nickname: null,
        coverImageKey: coverKey("spc_epipremnum_aureum"),
        note: null,
        status: InstanceStatus.Active,
        capturedAt: "2026-11-02T14:05:00.000Z",
        createdAt: "2026-11-02T14:05:00.000Z",
        updatedAt: "2026-11-02T14:05:00.000Z",
    };
    const rose = {
        id: "ins_seed_rose_1",
        userId: DEMO_USER_ID,
        speciesId: "spc_rosa_chinensis",
        captureId: "cap_seed_rose_1",
        nickname: null,
        coverImageKey: coverKey("spc_rosa_chinensis"),
        note: null,
        status: InstanceStatus.Active,
        capturedAt: "2026-10-20T11:12:00.000Z",
        createdAt: "2026-10-20T11:12:00.000Z",
        updatedAt: "2026-10-20T11:12:00.000Z",
    };
    const monstera = {
        id: "ins_seed_monstera_1",
        userId: DEMO_USER_ID,
        speciesId: "spc_monstera_deliciosa",
        captureId: "cap_seed_monstera_1",
        nickname: null,
        coverImageKey: coverKey("spc_monstera_deliciosa"),
        note: null,
        status: InstanceStatus.Active,
        capturedAt: "2026-11-08T16:40:00.000Z",
        createdAt: "2026-11-08T16:40:00.000Z",
        updatedAt: "2026-11-08T16:40:00.000Z",
    };
    const osmanthus = {
        id: "ins_seed_osmanthus_1",
        userId: DEMO_USER_ID,
        speciesId: "spc_osmanthus_fragrans",
        captureId: "cap_seed_osmanthus_1",
        nickname: null,
        coverImageKey: coverKey("spc_osmanthus_fragrans"),
        note: null,
        status: InstanceStatus.Active,
        capturedAt: "2026-11-18T08:30:00.000Z",
        createdAt: "2026-11-18T08:30:00.000Z",
        updatedAt: "2026-11-18T08:30:00.000Z",
    };

    const friends: FriendExplorer[] = [
        {
            id: "usr_friend_moss",
            displayName: "青苔旅人",
            avatarKey: "species-cover:friend-moss",
            discoveredSpeciesIds: [
                "spc_epipremnum_aureum",
                "spc_chlorophytum_comosum",
                "spc_dracaena_trifasciata",
                "spc_monstera_deliciosa",
                "spc_osmanthus_fragrans",
                "spc_ginkgo_biloba",
            ],
        },
        {
            id: "usr_friend_mist",
            displayName: "雾中采撷",
            avatarKey: "species-cover:friend-mist",
            discoveredSpeciesIds: ["spc_rosa_chinensis", "spc_helianthus_annuus", "spc_aloe_vera"],
        },
        {
            id: "usr_friend_window",
            displayName: "南窗植物志",
            avatarKey: "species-cover:friend-window",
            discoveredSpeciesIds: [
                "spc_epipremnum_aureum",
                "spc_pachira_aquatica",
                "spc_monstera_deliciosa",
                "spc_rosa_chinensis",
                "spc_hydrangea_macrophylla",
                "spc_osmanthus_fragrans",
                "spc_nelumbo_nucifera",
                "spc_cinnamomum_camphora",
            ],
        },
        {
            id: "usr_friend_forest",
            displayName: "林间手札",
            avatarKey: "species-cover:friend-forest",
            discoveredSpeciesIds: [
                "spc_ginkgo_biloba",
                "spc_cinnamomum_camphora",
                "spc_lagerstroemia_indica",
                "spc_asparagus_setaceus",
                "spc_kalanchoe_pinnata",
            ],
        },
        {
            id: "usr_friend_amber",
            displayName: "琥珀采集者",
            avatarKey: "species-cover:friend-amber",
            discoveredSpeciesIds: ["spc_aloe_vera", "spc_dracaena_trifasciata"],
        },
    ];

    return {
        version: 2,
        user: {
            id: DEMO_USER_ID,
            displayName: "摘星重现",
            avatarKey: "species-cover:user",
            createdAt: "2026-09-15T10:00:00.000Z",
        },
        friends,
        species,
        aliases: [
            {
                id: "als_pothos_zh",
                speciesId: "spc_epipremnum_aureum",
                alias: "黄金葛",
                language: "zh",
                aliasType: AliasType.Common,
                source: "seed",
            },
            {
                id: "als_snake_zh",
                speciesId: "spc_dracaena_trifasciata",
                alias: "虎尾兰",
                language: "zh",
                aliasType: AliasType.Common,
                source: "seed",
            },
        ],
        instances: [firstPothos, repeatPothos, rose, monstera, osmanthus],
        captures: [
            {
                id: "cap_seed_pothos_1",
                userId: DEMO_USER_ID,
                recognitionTaskId: null,
                speciesId: "spc_epipremnum_aureum",
                instanceId: firstPothos.id,
                imageKey: firstPothos.coverImageKey,
                capturedAt: firstPothos.capturedAt,
                discoveryType: DiscoveryType.First,
                confirmationType: ConfirmationType.AiPrimary,
                locationMode: LocationMode.None,
                locationData: null,
                idempotencyKey: "idem_seed_pothos_1",
                createdAt: firstPothos.createdAt,
            },
            {
                id: "cap_seed_pothos_2",
                userId: DEMO_USER_ID,
                recognitionTaskId: null,
                speciesId: "spc_epipremnum_aureum",
                instanceId: repeatPothos.id,
                imageKey: repeatPothos.coverImageKey,
                capturedAt: repeatPothos.capturedAt,
                discoveryType: DiscoveryType.Repeat,
                confirmationType: ConfirmationType.AiCandidate,
                locationMode: LocationMode.None,
                locationData: null,
                idempotencyKey: "idem_seed_pothos_2",
                createdAt: repeatPothos.createdAt,
            },
            {
                id: "cap_seed_rose_1",
                userId: DEMO_USER_ID,
                recognitionTaskId: null,
                speciesId: "spc_rosa_chinensis",
                instanceId: rose.id,
                imageKey: rose.coverImageKey,
                capturedAt: rose.capturedAt,
                discoveryType: DiscoveryType.First,
                confirmationType: ConfirmationType.AiPrimary,
                locationMode: LocationMode.None,
                locationData: null,
                idempotencyKey: "idem_seed_rose_1",
                createdAt: rose.createdAt,
            },
            {
                id: "cap_seed_monstera_1",
                userId: DEMO_USER_ID,
                recognitionTaskId: null,
                speciesId: "spc_monstera_deliciosa",
                instanceId: monstera.id,
                imageKey: monstera.coverImageKey,
                capturedAt: monstera.capturedAt,
                discoveryType: DiscoveryType.First,
                confirmationType: ConfirmationType.AiPrimary,
                locationMode: LocationMode.None,
                locationData: null,
                idempotencyKey: "idem_seed_monstera_1",
                createdAt: monstera.createdAt,
            },
            {
                id: "cap_seed_osmanthus_1",
                userId: DEMO_USER_ID,
                recognitionTaskId: null,
                speciesId: "spc_osmanthus_fragrans",
                instanceId: osmanthus.id,
                imageKey: osmanthus.coverImageKey,
                capturedAt: osmanthus.capturedAt,
                discoveryType: DiscoveryType.First,
                confirmationType: ConfirmationType.AiPrimary,
                locationMode: LocationMode.None,
                locationData: null,
                idempotencyKey: "idem_seed_osmanthus_1",
                createdAt: osmanthus.createdAt,
            },
        ],
        tasks: [],
        discoveries: [
            {
                id: "dsc_pothos",
                userId: DEMO_USER_ID,
                speciesId: "spc_epipremnum_aureum",
                firstInstanceId: firstPothos.id,
                firstDiscoveredAt: firstPothos.capturedAt,
                instanceCount: 2,
                createdAt: firstPothos.createdAt,
                updatedAt: repeatPothos.createdAt,
            },
            {
                id: "dsc_rose",
                userId: DEMO_USER_ID,
                speciesId: "spc_rosa_chinensis",
                firstInstanceId: rose.id,
                firstDiscoveredAt: rose.capturedAt,
                instanceCount: 1,
                createdAt: rose.createdAt,
                updatedAt: rose.createdAt,
            },
            {
                id: "dsc_monstera",
                userId: DEMO_USER_ID,
                speciesId: "spc_monstera_deliciosa",
                firstInstanceId: monstera.id,
                firstDiscoveredAt: monstera.capturedAt,
                instanceCount: 1,
                createdAt: monstera.createdAt,
                updatedAt: monstera.createdAt,
            },
            {
                id: "dsc_osmanthus",
                userId: DEMO_USER_ID,
                speciesId: "spc_osmanthus_fragrans",
                firstInstanceId: osmanthus.id,
                firstDiscoveredAt: osmanthus.capturedAt,
                instanceCount: 1,
                createdAt: osmanthus.createdAt,
                updatedAt: osmanthus.createdAt,
            },
        ],
        images: [],
        simulations: {},
    };
}
