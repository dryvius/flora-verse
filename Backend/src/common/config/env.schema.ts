import { z } from 'zod';

const PLACEHOLDER_MARKERS = ['change-before-production', 'replace-me'] as const;

const optionalText = z
  .string()
  .optional()
  .transform((value: string | undefined): string | undefined => {
    if (value === undefined || value.trim() === '') {
      return undefined;
    }
    return value;
  });

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z
      .string()
      .min(1)
      .refine((value) => value.startsWith('mysql://'), {
        message: 'DATABASE_URL must start with mysql://',
      }),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    WECHAT_APP_ID: z.string().default(''),
    WECHAT_APP_SECRET: z.string().default(''),
    STORAGE_PROVIDER: z.enum(['local', 'cos']).default('local'),
    COS_SECRET_ID: z.string().default(''),
    COS_SECRET_KEY: z.string().default(''),
    COS_BUCKET: z.string().default(''),
    COS_REGION: z.string().default(''),
    PLANT_RECOGNITION_PROVIDER: z.string().min(1).default('mock'),
    PLANT_RECOGNITION_API_KEY: z.string().default(''),
    IMAGE_GENERATION_PROVIDER: z.string().min(1).default('mock'),
    IMAGE_GENERATION_API_KEY: z.string().default(''),
    SWAGGER_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform(
        (value: 'true' | 'false' | undefined): boolean => value === 'true',
      ),
    CORS_ORIGIN: optionalText,
  })
  .superRefine((config, context) => {
    if (config.NODE_ENV !== 'production') {
      return;
    }

    const secrets = [
      ['JWT_ACCESS_SECRET', config.JWT_ACCESS_SECRET],
      ['JWT_REFRESH_SECRET', config.JWT_REFRESH_SECRET],
    ] as const;

    for (const [field, secret] of secrets) {
      const usesPlaceholder = PLACEHOLDER_MARKERS.some((marker) =>
        secret.includes(marker),
      );
      if (!usesPlaceholder) {
        continue;
      }
      context.addIssue({
        code: 'custom',
        path: [field],
        message: 'production secret must be replaced',
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (parsed.success) {
    return parsed.data;
  }

  const fields = [
    ...new Set(
      parsed.error.issues.map((issue) => issue.path.join('.') || 'root'),
    ),
  ].join(', ');
  throw new Error(`Invalid environment variables: ${fields}`);
}
