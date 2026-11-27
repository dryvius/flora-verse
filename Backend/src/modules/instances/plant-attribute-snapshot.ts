export const EMPTY_PLANT_ATTRIBUTE_VERSION = '0';

export interface PlantAttributeSnapshot {
  version: string;
  attributes: Record<string, never>;
}

export function createEmptyPlantAttributeSnapshot(
  version: string = EMPTY_PLANT_ATTRIBUTE_VERSION,
): PlantAttributeSnapshot {
  return {
    version,
    attributes: {},
  };
}

export function assertPlantAttributeSnapshot(value: unknown): PlantAttributeSnapshot {
  if (!isRecord(value)) {
    throw new Error('Plant attribute snapshot must be an object');
  }

  const version = value.version;
  const attributes = value.attributes;
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('Plant attribute snapshot version is required');
  }
  if (!isRecord(attributes)) {
    throw new Error('Plant attribute snapshot attributes must be an object');
  }
  if (Object.keys(attributes).length > 0) {
    throw new Error('Plant attribute names are not confirmed');
  }

  return {
    version,
    attributes: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
