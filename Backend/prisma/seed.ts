import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  AssetKind,
  AssetVisibility,
  CatalogStatus,
  InstanceStatus,
  Prisma,
  PrismaClient,
  StorageProvider,
} from '../src/generated/prisma/client.js';

const CATALOG_AT = new Date('2026-09-01T08:00:00.000Z');
const DEMO_USER_ID = 'usr_demo_001';
const DEMO_USER_CREATED_AT = new Date('2026-09-15T10:00:00.000Z');

interface Characteristics {
  leafShape: string;
  typicalHeight: string;
  notableFeatures: string[];
}

interface SpeciesSeed {
  id: string;
  scientificName: string;
  chineseName: string;
  commonNames: string[];
  family: string;
  genus: string;
  description: string;
  characteristics: Characteristics;
  baseCombatPower: number;
}

interface InstanceSeed {
  id: string;
  captureId: string;
  speciesId: string;
  capturedAt: string;
}

const FAMILY_IDS: Readonly<Record<string, string>> = {
  天南星科: 'fam_tiannanxing',
  天门冬科: 'fam_tianmendong',
  木棉科: 'fam_mumian',
  阿福花科: 'fam_afuhua',
  蔷薇科: 'fam_qiangwei',
  绣球科: 'fam_xiuqiu',
  木犀科: 'fam_muxi',
  银杏科: 'fam_yinxing',
  樟科: 'fam_zhang',
  千屈菜科: 'fam_qianqucai',
  莲科: 'fam_lian',
  菊科: 'fam_ju',
  景天科: 'fam_jingtian',
};

const SPECIES: readonly SpeciesSeed[] = [
  {
    id: 'spc_epipremnum_aureum',
    scientificName: 'Epipremnum aureum',
    chineseName: '绿萝',
    commonNames: ['黄金葛'],
    family: '天南星科',
    genus: '麒麟叶属',
    description: '常见室内藤本观叶植物，叶片心形，耐阴，适合作为入门识别样本。',
    characteristics: {
      leafShape: '心形',
      typicalHeight: '藤蔓可延伸数米',
      notableFeatures: ['叶面常有黄绿色斑纹', '气生根明显'],
    },
    baseCombatPower: 120,
  },
  {
    id: 'spc_chlorophytum_comosum',
    scientificName: 'Chlorophytum comosum',
    chineseName: '吊兰',
    commonNames: ['折鹤兰'],
    family: '天门冬科',
    genus: '吊兰属',
    description: '丛生草本，叶细长拱垂，走茎先端易长出新植株。',
    characteristics: {
      leafShape: '线状披针形',
      typicalHeight: '20-40 厘米',
      notableFeatures: ['叶缘常具白边', '悬垂走茎'],
    },
    baseCombatPower: 110,
  },
  {
    id: 'spc_dracaena_trifasciata',
    scientificName: 'Dracaena trifasciata',
    chineseName: '虎皮兰',
    commonNames: ['虎尾兰'],
    family: '天门冬科',
    genus: '龙血树属',
    description: '肉质直立叶，表面有横向斑纹，耐旱，常被栽于室内。',
    characteristics: {
      leafShape: '剑形肉质叶',
      typicalHeight: '30-80 厘米',
      notableFeatures: ['叶表横纹', '极耐干旱'],
    },
    baseCombatPower: 180,
  },
  {
    id: 'spc_monstera_deliciosa',
    scientificName: 'Monstera deliciosa',
    chineseName: '龟背竹',
    commonNames: ['蓬莱蕉'],
    family: '天南星科',
    genus: '龟背竹属',
    description: '大型观叶植物，成熟叶片出现羽状开裂与穿孔。',
    characteristics: {
      leafShape: '近圆形，成熟后开裂',
      typicalHeight: '室内可达 1-2 米',
      notableFeatures: ['叶窗孔', '粗壮气生根'],
    },
    baseCombatPower: 260,
  },
  {
    id: 'spc_pachira_aquatica',
    scientificName: 'Pachira aquatica',
    chineseName: '发财树',
    commonNames: ['马拉巴栗'],
    family: '木棉科',
    genus: '瓜栗属',
    description: '掌状复叶，茎基部常膨大，室内常见编织主干造型。',
    characteristics: {
      leafShape: '掌状复叶',
      typicalHeight: '室内 0.5-2 米',
      notableFeatures: ['茎基膨大', '小叶 5-7 枚'],
    },
    baseCombatPower: 200,
  },
  {
    id: 'spc_aloe_vera',
    scientificName: 'Aloe vera',
    chineseName: '芦荟',
    commonNames: ['库拉索芦荟'],
    family: '阿福花科',
    genus: '芦荟属',
    description: '莲座状多浆植物，叶缘有齿，叶肉肥厚。',
    characteristics: {
      leafShape: '披针形肉质叶',
      typicalHeight: '30-60 厘米',
      notableFeatures: ['叶缘锯齿', '叶肉凝胶状'],
    },
    baseCombatPower: 150,
  },
  {
    id: 'spc_rosa_chinensis',
    scientificName: 'Rosa chinensis',
    chineseName: '月季',
    commonNames: ['月月红'],
    family: '蔷薇科',
    genus: '蔷薇属',
    description: '灌木花卉，花色丰富，园林与阳台常见栽培。',
    characteristics: {
      leafShape: '奇数羽状复叶',
      typicalHeight: '0.5-2 米',
      notableFeatures: ['花期长', '茎常具皮刺'],
    },
    baseCombatPower: 220,
  },
  {
    id: 'spc_hydrangea_macrophylla',
    scientificName: 'Hydrangea macrophylla',
    chineseName: '绣球',
    commonNames: ['八仙花'],
    family: '绣球科',
    genus: '绣球属',
    description: '大型聚伞花序，花色随土壤酸碱度变化。',
    characteristics: {
      leafShape: '卵形对生叶',
      typicalHeight: '1-2 米',
      notableFeatures: ['球状花序', '花色可变'],
    },
    baseCombatPower: 190,
  },
  {
    id: 'spc_osmanthus_fragrans',
    scientificName: 'Osmanthus fragrans',
    chineseName: '桂花',
    commonNames: ['木犀'],
    family: '木犀科',
    genus: '木犀属',
    description: '常绿小乔木或灌木，秋季开花，香气浓郁。',
    characteristics: {
      leafShape: '椭圆形革质叶',
      typicalHeight: '3-8 米',
      notableFeatures: ['秋季开花', '花香显著'],
    },
    baseCombatPower: 240,
  },
  {
    id: 'spc_ginkgo_biloba',
    scientificName: 'Ginkgo biloba',
    chineseName: '银杏',
    commonNames: ['白果'],
    family: '银杏科',
    genus: '银杏属',
    description: '落叶乔木，扇形叶，秋叶金黄，行道树常见。',
    characteristics: {
      leafShape: '扇形',
      typicalHeight: '可达 20 米以上',
      notableFeatures: ['叶脉二叉', '秋季转黄'],
    },
    baseCombatPower: 320,
  },
  {
    id: 'spc_cinnamomum_camphora',
    scientificName: 'Cinnamomum camphora',
    chineseName: '香樟',
    commonNames: ['樟树'],
    family: '樟科',
    genus: '樟属',
    description: '常绿乔木，揉叶有香气，城市绿化常见。',
    characteristics: {
      leafShape: '卵状椭圆形',
      typicalHeight: '可达 20 米以上',
      notableFeatures: ['叶有樟脑香', '树冠开展'],
    },
    baseCombatPower: 300,
  },
  {
    id: 'spc_lagerstroemia_indica',
    scientificName: 'Lagerstroemia indica',
    chineseName: '紫薇',
    commonNames: ['百日红'],
    family: '千屈菜科',
    genus: '紫薇属',
    description: '落叶小乔木，夏季开花期长，树皮光滑。',
    characteristics: {
      leafShape: '椭圆形对生或近对生',
      typicalHeight: '3-7 米',
      notableFeatures: ['花期长', '树干光滑'],
    },
    baseCombatPower: 210,
  },
  {
    id: 'spc_nelumbo_nucifera',
    scientificName: 'Nelumbo nucifera',
    chineseName: '荷花',
    commonNames: ['莲'],
    family: '莲科',
    genus: '莲属',
    description: '水生草本，叶圆盾状，夏季开花。',
    characteristics: {
      leafShape: '圆形盾状',
      typicalHeight: '挺水 0.5-1.5 米',
      notableFeatures: ['叶柄居中', '花叶同季'],
    },
    baseCombatPower: 280,
  },
  {
    id: 'spc_helianthus_annuus',
    scientificName: 'Helianthus annuus',
    chineseName: '向日葵',
    commonNames: ['葵花'],
    family: '菊科',
    genus: '向日葵属',
    description: '一年生草本，头状花序大，舌状花通常金黄。',
    characteristics: {
      leafShape: '心状卵形',
      typicalHeight: '1-3 米',
      notableFeatures: ['大型头状花序', '茎直立粗糙'],
    },
    baseCombatPower: 170,
  },
  {
    id: 'spc_kalanchoe_pinnata',
    scientificName: 'Kalanchoe pinnata',
    chineseName: '落地生根',
    commonNames: ['花蝴蝶'],
    family: '景天科',
    genus: '伽蓝菜属',
    description: '多浆草本，叶缘易萌生小植株，常被当作多肉观察。',
    characteristics: {
      leafShape: '羽状复叶或单叶',
      typicalHeight: '30-100 厘米',
      notableFeatures: ['叶缘不定芽', '肉质茎叶'],
    },
    baseCombatPower: 140,
  },
  {
    id: 'spc_asparagus_setaceus',
    scientificName: 'Asparagus setaceus',
    chineseName: '文竹',
    commonNames: ['云片竹'],
    family: '天门冬科',
    genus: '天门冬属',
    description: '纤细观叶植物，叶状枝呈片状，姿态轻盈。',
    characteristics: {
      leafShape: '叶状枝纤细如羽毛',
      typicalHeight: '室内 30-80 厘米',
      notableFeatures: ['云片状分枝', '茎具刺或平滑'],
    },
    baseCombatPower: 130,
  },
];

const INSTANCES: readonly InstanceSeed[] = [
  {
    id: 'ins_seed_pothos_1',
    captureId: 'cap_seed_pothos_1',
    speciesId: 'spc_epipremnum_aureum',
    capturedAt: '2026-10-12T09:20:00.000Z',
  },
  {
    id: 'ins_seed_pothos_2',
    captureId: 'cap_seed_pothos_2',
    speciesId: 'spc_epipremnum_aureum',
    capturedAt: '2026-11-02T14:05:00.000Z',
  },
  {
    id: 'ins_seed_rose_1',
    captureId: 'cap_seed_rose_1',
    speciesId: 'spc_rosa_chinensis',
    capturedAt: '2026-10-20T11:12:00.000Z',
  },
  {
    id: 'ins_seed_monstera_1',
    captureId: 'cap_seed_monstera_1',
    speciesId: 'spc_monstera_deliciosa',
    capturedAt: '2026-11-08T16:40:00.000Z',
  },
  {
    id: 'ins_seed_osmanthus_1',
    captureId: 'cap_seed_osmanthus_1',
    speciesId: 'spc_osmanthus_fragrans',
    capturedAt: '2026-11-18T08:30:00.000Z',
  },
];

function coverKey(speciesId: string): string {
  return `species-cover:${speciesId}`;
}

function coverAssetId(speciesId: string): string {
  return `ast_cover_${speciesId}`;
}

function genusId(scientificName: string): string {
  return `gen_${genusScientificName(scientificName).toLowerCase()}`;
}

function genusScientificName(scientificName: string): string {
  const [genus] = scientificName.split(' ');
  if (genus === undefined || genus.length === 0) {
    throw new Error('Species scientific name must include a genus');
  }
  return genus;
}

function toCharacteristics(value: Characteristics): Prisma.InputJsonValue {
  return {
    leafShape: value.leafShape,
    typicalHeight: value.typicalHeight,
    notableFeatures: [...value.notableFeatures],
  };
}

async function seed(prisma: PrismaClient): Promise<void> {
  const familyNames = [...new Set(SPECIES.map((item) => item.family))];
  for (const chineseName of familyNames) {
    const id = FAMILY_IDS[chineseName];
    if (id === undefined) {
      throw new Error('Missing family id');
    }
    await prisma.plantFamily.upsert({
      where: { id },
      update: {
        chineseName,
        status: CatalogStatus.ACTIVE,
      },
      create: {
        id,
        chineseName,
        status: CatalogStatus.ACTIVE,
        createdAt: CATALOG_AT,
        updatedAt: CATALOG_AT,
      },
    });
  }

  for (const item of SPECIES) {
    const familyId = FAMILY_IDS[item.family];
    if (familyId === undefined) {
      throw new Error('Missing family id');
    }
    const scientificGenus = genusScientificName(item.scientificName);
    const currentGenusId = genusId(item.scientificName);
    await prisma.plantGenus.upsert({
      where: { id: currentGenusId },
      update: {
        familyId,
        scientificName: scientificGenus,
        chineseName: item.genus,
        status: CatalogStatus.ACTIVE,
      },
      create: {
        id: currentGenusId,
        familyId,
        scientificName: scientificGenus,
        chineseName: item.genus,
        status: CatalogStatus.ACTIVE,
        createdAt: CATALOG_AT,
        updatedAt: CATALOG_AT,
      },
    });

    const assetId = coverAssetId(item.id);
    const objectKey = coverKey(item.id);
    await prisma.asset.upsert({
      where: {
        storageProvider_objectKey: {
          storageProvider: StorageProvider.LOCAL,
          objectKey,
        },
      },
      update: {
        kind: AssetKind.SPECIES_COVER,
        visibility: AssetVisibility.PUBLIC,
      },
      create: {
        id: assetId,
        kind: AssetKind.SPECIES_COVER,
        storageProvider: StorageProvider.LOCAL,
        objectKey,
        visibility: AssetVisibility.PUBLIC,
        createdAt: CATALOG_AT,
        updatedAt: CATALOG_AT,
      },
    });

    await prisma.plantSpecies.upsert({
      where: { id: item.id },
      update: {
        genusId: currentGenusId,
        scientificName: item.scientificName,
        chineseName: item.chineseName,
        commonNames: item.commonNames,
        description: item.description,
        characteristics: toCharacteristics(item.characteristics),
        baseCombatPower: item.baseCombatPower,
        representativeAssetId: assetId,
        status: CatalogStatus.ACTIVE,
        taxonomySource: 'floraverse-seed',
        taxonomyVersion: '2026.11',
      },
      create: {
        id: item.id,
        genusId: currentGenusId,
        scientificName: item.scientificName,
        chineseName: item.chineseName,
        commonNames: item.commonNames,
        description: item.description,
        characteristics: toCharacteristics(item.characteristics),
        baseCombatPower: item.baseCombatPower,
        representativeAssetId: assetId,
        status: CatalogStatus.ACTIVE,
        taxonomySource: 'floraverse-seed',
        taxonomyVersion: '2026.11',
        createdAt: CATALOG_AT,
        updatedAt: CATALOG_AT,
      },
    });
  }

  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: { nickname: '摘星重现' },
    create: {
      id: DEMO_USER_ID,
      nickname: '摘星重现',
      createdAt: DEMO_USER_CREATED_AT,
      updatedAt: DEMO_USER_CREATED_AT,
    },
  });

  for (const item of INSTANCES) {
    const capturedAt = new Date(item.capturedAt);
    const assetId = coverAssetId(item.speciesId);
    await prisma.plantCapture.upsert({
      where: { id: item.captureId },
      update: {
        capturedAt,
        sourceAssetId: assetId,
      },
      create: {
        id: item.captureId,
        userId: DEMO_USER_ID,
        speciesId: item.speciesId,
        sourceAssetId: assetId,
        idempotencyKey: `seed:${item.captureId}`,
        capturedAt,
        createdAt: capturedAt,
        updatedAt: capturedAt,
      },
    });
    await prisma.plantInstance.upsert({
      where: { id: item.id },
      update: {
        capturedAt,
        coverAssetId: assetId,
        status: InstanceStatus.ACTIVE,
      },
      create: {
        id: item.id,
        ownerUserId: DEMO_USER_ID,
        speciesId: item.speciesId,
        captureId: item.captureId,
        coverAssetId: assetId,
        status: InstanceStatus.ACTIVE,
        level: 1,
        experience: 0,
        capturedAt,
        createdAt: capturedAt,
        updatedAt: capturedAt,
      },
    });
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error('DATABASE_URL is required');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  });

  try {
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

try {
  await main();
} catch (error: unknown) {
  const message =
    error instanceof Error
      ? error.message.replace(/mysql:\/\/[^\s'"]+/gi, 'mysql://***')
      : 'Seed failed';
  console.error(message);
  process.exit(1);
}
