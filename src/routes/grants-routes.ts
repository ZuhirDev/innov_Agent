import { Router, Request, Response, NextFunction } from 'express';
import { poolConection } from '@/config/db';
import { GRANTS_SEARCH_TOPICS } from '@/mastra/tools/grants-tools';
import { grantsWorkflow } from '@/mastra/workflows/grants-workflow';

const router = Router();

/**
 * GET /grants
 * Retrieves the latest list of grants from the database.
 */
router.get('/grants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await poolConection.query(
      'SELECT id, title, description, category, url, source, created_at FROM grants_results ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching grants from database' });
  }
});

/**
 * GET /grants/sync
 * Asynchronously triggers the grants workflow to scrape, filter, and save new grants.
 * Clears old records and inserts the new ones upon successful execution.
 */
router.get('/grants/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Starting grants workflow sync...");
    const run = await grantsWorkflow.createRun();
    const { runId } = await run.startAsync({
      inputData: {
        topics: GRANTS_SEARCH_TOPICS,
      },
    });
    res.json({ success: true, runId, message: 'Workflow started' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start workflow' });
  }
});

export default router;
