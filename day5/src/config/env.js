require('dotenv').config();

const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(10),
  UPLOAD_MAX_MB: z.coerce.number().default(5),
  CACHE_TTL_SECONDS: z.coerce.number().default(30),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@tasks.local'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment configuration:');
  result.error.errors.forEach((e) => console.error(`  - ${e.path.join('.')}: ${e.message}`));
  process.exit(1);
}

module.exports = result.data;
