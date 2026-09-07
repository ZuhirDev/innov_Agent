import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    CIGES_API_URL: z.string().default(''),
    PORT: z.coerce.number().int().positive().default(4111),
    GROQ_API_KEY: z.string().optional(),

    PG_ID: z.string().default(''),
    PG_HOST: z.string().default(''),
    PG_PORT: z.coerce.number().int().positive().default(6543),
    PG_DATABASE: z.string().default(''),
    PG_USER: z.string().default(''),
    PG_PASSWORD: z.string().default(''),

    STORAGE_TYPE: z.enum(['pg', 'libsql']).default('libsql'),
    LIBSQL_URL: z.string().default('file:mastra.db'),

    GITHUB_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(z.treeifyError(parsed.error));
    throw new Error('Invalid environment variables');
}

const env = parsed.data;

export interface AppConfig {
    CIGES_API_URL: string;
    PORT: number;
    GROQ: { API_KEY?: string };
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
    GITHUB: {
        TOKEN?: string;
    };
}

const CONFIG: AppConfig = {
    CIGES_API_URL: env.CIGES_API_URL,
    PORT: env.PORT,
    GROQ: { API_KEY: env.GROQ_API_KEY },
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
    GITHUB: {
        TOKEN: env.GITHUB_TOKEN,
    },
};

export default CONFIG;