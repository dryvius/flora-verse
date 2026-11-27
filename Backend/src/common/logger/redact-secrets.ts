export function redactSecrets(value: string): string {
  return value
    .replace(/mysql:\/\/[^\s'"]+/gi, 'mysql://***')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer ***');
}

export function redactUnknown(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  return redactSecrets(value);
}
