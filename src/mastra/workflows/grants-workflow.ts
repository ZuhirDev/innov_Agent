import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { GRANTS_SEARCH_TOPICS } from '@tools/grants-tools';

// ─── Workflow definition ───────────────────────────────────────────────────────

/**
 * The Grants Workflow.
 * Orchestrates the search and retrieval process for energy and sustainability grants.
 * Triggers the Grants Agent with predefined search topics.
 */
export const grantsWorkflow = createWorkflow({
  id: 'grants-workflow',
  inputSchema: z.object({
    topics: z.array(z.string()).describe('List of search topics for grants'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    summary: z.string(),
  }),
})
  .then(
    createStep({
      id: 'search-grants',
      inputSchema: z.object({
        topics: z.array(z.string()).describe('List of search topics for grants'),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        summary: z.string(),
      }),
      execute: async ({ inputData, mastra }) => {
        const logger = mastra?.getLogger();
        logger?.info('🚀 grantsWorkflow [step 1 - search]: Starting searches with Tavily', {
          topicsCount: inputData.topics.length,
        });

        try {
          const agent = mastra?.getAgent('grantsAgent');
          if (!agent) {
            throw new Error('grantsAgent not found in Mastra registry');
          }

          const prompt = `
            Search for energy and sustainability grants for businesses in Ireland using the following topics.
            For each topic, use the grants-search tool with ONLY the "query" parameter.

            Topics:
            ${inputData.topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

            After searching ALL topics, compile the results. For each result include:
            - The title
            - The URL
            - A brief summary of what the grant covers
            - The source organization

            Then filter the results strictly according to your instructions:
            - Ireland only (discard UK-only or generic EU)
            - Businesses only (discard residential/household)
            - Official sources only (discard blogs/low-quality)
            - No duplicate URLs

            Finally, save the filtered grants using the grants-save-results tool.

            After saving, list all the grants you found with their details.
          `.trim();

          const response = await agent.generate(prompt, {
            maxSteps: 20,
          });

          logger?.info('✅ grantsWorkflow [step 1 - search]: Searches completed', {
            responseLength: response.text?.length ?? 0,
          });

          return {
            success: true,
            summary: response.text || 'Grants processed and saved successfully.',
          };
                    
        } catch (error) {
          logger?.error('❌ grantsWorkflow [step 1 - search]: Error', { error: String(error) });
          return {
            success: false,
            summary: 'Error processing grants: ' + String(error),
          };
        }
      },
    })
  );

grantsWorkflow.commit();

// ─── Helper: default topics ────────────────────────────────────────────────────

export { GRANTS_SEARCH_TOPICS };
