import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { FileTransport } from '@mastra/loggers/file';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { grantsAgent, attachGrantsAgentLogging } from '@agents/grants-agent';
import { grantsWorkflow } from '../mastra/workflows/grants-workflow';
import storage from '@/mastra/storage';

export const mastra = new Mastra({
  workflows: { grantsWorkflow },
  agents: { grantsAgent },
  scorers: {},
  storage: new MastraCompositeStore({
    id: 'agent-storage',
    default: storage,
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
    transports: { file: new FileTransport({ path: "C:\\Users\\zelha\\Desktop\\innov_Agent\\src\\mastra\\grants-agent.log" }) }
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});

try {
  attachGrantsAgentLogging?.(mastra);
} catch (err) {
  mastra.getLogger()?.error('❌ Failed to attach grants agent logging', { error: err?.toString?.() || err });
}
