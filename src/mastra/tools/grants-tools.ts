import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { tavily } from '@tavily/core';
import { poolConection } from '@/config/db';
import CONFIG from '@/config/config';

/**
 * Fixed list of official Irish domains to prioritize in searches.
 */
const IRELAND_OFFICIAL_DOMAINS = [
  'seai.ie',
  'gov.ie',
  'enterprise-ireland.com',
  'localenterprise.ie',
  'citizensinformation.ie',
  'revenue.ie',
  'sfa.ie',
  'ibec.ie',
  'chambers.ie',
];

/**
 * Fixed list of search topics for energy and sustainability grants
 * for businesses in Ireland. Manually adjusted as needed.
 */
export const GRANTS_SEARCH_TOPICS = [
  'Ireland SEAI business energy grants 2025 2026',
  'Ireland enterprise sustainability grants for businesses',
  'Ireland government green energy grants for SMEs',
  'Ireland commercial building energy upgrade grants',
  'Ireland renewable energy grants for organizations',
  'Ireland carbon reduction business funding',
  'Ireland energy efficiency grants for companies',
  'SEAI community energy grants Ireland',
];


// ─── grantsSearchTool ──────────────────────────────────────────────────────────

/**
 * Tool for searching the internet for Irish energy and sustainability grants.
 * Prioritizes official government and agency sources using the Tavily API.
 * 
 * @param query - The search query related to Irish business energy/sustainability grants.
 * @returns A list of relevant search results with title, URL, and summary content.
 */
export const grantsSearchTool = createTool({
  id: 'grants-search',
  description: 'Searches the internet for energy and sustainability grants available to businesses in Ireland using the Tavily API. Prioritizes official Irish government and agency sources.',
  inputSchema: z.object({
    query: z.string().describe('The search query related to Irish business energy/sustainability grants'),
  }),
  outputSchema: z.object({
    query: z.string(),
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
        score: z.number().optional(),
      }),
    ),
  }),
  execute: async ({ query }, { mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔍 grantsSearchTool: Starting grant search', { query });

    try {
      const tvly = tavily();
      const response = await tvly.search(query, {
        searchDepth: 'advanced',
        maxResults: 2, //10
        includeDomains: IRELAND_OFFICIAL_DOMAINS,
      });

      const results = response.results.map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        content: r.content || '',
        score: r.score ?? 0,
      }));

      logger?.info('✅ grantsSearchTool: Search completed', {
        query,
        resultsCount: results.length,
      });

      return { query, results };
    } catch (error) {
      logger?.error('❌ grantsSearchTool: Search failed', {
        query,
        error: String(error),
      });
      throw error;
    }
  },
});

// ─── grantsSaveResultsTool ─────────────────────────────────────────────────────

/**
 * Tool for saving the final filtered list of grants to the PostgreSQL database.
 * Ensures the 'grants_results' table exists and clears previous records before inserting.
 * 
 * @param grants - Array of grant objects containing title, description, category, url, and source.
 * @returns Success status and the number of records saved.
 */
export const grantsSaveResultsTool = createTool({
  id: 'grants-save-results',
  description:
    'Saves the final filtered and classified list of grants to a PostgreSQL/Supabase database.',
  inputSchema: z.object({
    grants: z.array(
      z.object({
        title: z.string().describe('Short descriptive title of the grant'),
        description: z.string().describe('Simple, easy-to-understand description of the grant'),
        category: z.string().describe('Category: e.g. Energy Efficiency, Renewable Energy, Sustainability, Carbon Reduction'),
        url: z.string().describe('Official URL where the user can apply or learn more'),
        source: z.string().describe('Name of the issuing organization, e.g. SEAI, Enterprise Ireland'),
      }),
    ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    savedCount: z.number(),
  }),
  execute: async ({ grants }, { mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('💾 grantsSaveResultsTool: Saving results to DB', { grantsCount: grants.length });

    try {

      // Ensure table exists
      await poolConection.query(`
        CREATE TABLE IF NOT EXISTS grants_results (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            url TEXT NOT NULL,
            source TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Clear previous records before inserting new ones
      await poolConection.query(`DELETE FROM grants_results;`);

      // Insert each grant
      for (const grant of grants) {
        await poolConection.query(
          `INSERT INTO grants_results (title, description, category, url, source)
           VALUES ($1, $2, $3, $4, $5)`,
          [grant.title, grant.description, grant.category, grant.url, grant.source]
        );
      }

      logger?.info('✅ grantsSaveResultsTool: Results successfully saved to database', {
        savedCount: grants.length,
      });

      return {
        success: true,
        savedCount: grants.length,
      };
    } catch (error) {
      logger?.error('❌ grantsSaveResultsTool: Error while saving to DB', { error: String(error) });
      throw error;
    }
  },
});
