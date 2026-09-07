import CONFIG from "@/config/config";
import { LibSQLStore } from "@mastra/libsql";
import { PostgresStore } from "@mastra/pg";

const pgStorage = new PostgresStore({
    id: CONFIG.PG.ID,
    host: CONFIG.PG.HOST,
    port: CONFIG.PG.PORT,
    database: CONFIG.PG.DATABASE,
    user: CONFIG.PG.USER,
    password: CONFIG.PG.PASSWORD,
});

const libSqlStorage = new LibSQLStore({
    id: "mastra-storage",
    url: CONFIG.LIBSQL.URL,
});


let storage: PostgresStore | LibSQLStore;

switch (CONFIG.STORAGE_TYPE) {
    case 'pg':
        storage = pgStorage;
        break;  
    case 'libsql':
        storage = libSqlStorage;
        break;
    default:
        storage = libSqlStorage;
        break;
}

export default storage;