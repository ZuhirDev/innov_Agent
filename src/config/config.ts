import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(4111),
    GROQ_API_KEY: z.string().optional(),
    TAVILY_API_KEY: z.string().optional(),

    PG_ID: z.string().default(''),
    PG_HOST: z.string().default(''),
    PG_PORT: z.coerce.number().int().positive().default(6543),
    PG_DATABASE: z.string().default(''),
    PG_USER: z.string().default(''),
    PG_PASSWORD: z.string().default(''),

    STORAGE_TYPE: z.enum(['pg', 'libsql']).default('libsql'),
    LIBSQL_URL: z.string().default('file:mastra.db'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(z.treeifyError(parsed.error));
    throw new Error('Invalid environment variables');
}

const env = parsed.data;

export interface AppConfig {
    PORT: number;
    GROQ: { API_KEY?: string };
    TAVILY: { API_KEY?: string };
    PG: {
        ID: string;
        HOST: string;
        PORT: number;
        DATABASE: string;
        USER: string;
        PASSWORD: string;
    };
    STORAGE_TYPE: 'pg' | 'libsql';
    LIBSQL: {
        URL: string;
    };
}

const CONFIG: AppConfig = {
    PORT: env.PORT,
    GROQ: { API_KEY: env.GROQ_API_KEY },
    TAVILY: { API_KEY: env.TAVILY_API_KEY },
    PG: {
        ID: env.PG_ID,
        HOST: env.PG_HOST,
        PORT: env.PG_PORT,
        DATABASE: env.PG_DATABASE,
        USER: env.PG_USER,
        PASSWORD: env.PG_PASSWORD,
    },
    STORAGE_TYPE: env.STORAGE_TYPE,
    LIBSQL: {
        URL: env.LIBSQL_URL,
    },
};

export default CONFIG;