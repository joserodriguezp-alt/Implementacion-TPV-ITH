import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL debe ser una URL válida' }),
  SUPABASE_SERVICE_KEY: z.string().min(1, { message: 'SUPABASE_SERVICE_KEY es requerida' }),
  JWT_SECRET: z.string().min(16, { message: 'JWT_SECRET debe tener al menos 16 caracteres' }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  parsed.error.errors.forEach((e) => console.error(` - ${e.path.join('.')}: ${e.message}`));
  process.exit(1);
}

export const env = parsed.data;
