import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

const mask = (s?: string) => {
  if (typeof s !== 'string') return s;
  if (s.length <= 4) return s;
  return `${s.slice(0, 2)}...${s.slice(-2)}`;
};

export const dateTimeTool = createTool({
  id: 'get-current-date-time',
  description: 'Returns the current date, time, and day of the week.',
  inputSchema: z.any().optional(),
  outputSchema: z.object({
    date: z.string().describe('Current date in YYYY-MM-DD format'),
    time: z.string().describe('Current time in HH:mm:ss format'),
    day: z.string().describe('Current day of the week'),
    year: z.number().describe('Current year'),
  }),
  execute: async (input, { mastra }) => {
    const logger = mastra?.getLogger();
    let parsedInput: any = input;
    if (typeof input === 'string') {
      try {
        parsedInput = JSON.parse(input);
      } catch (err) {
        logger?.warn('⚠️ dateTimeTool: Could not parse input JSON, ignoring and continuing', { rawInput: input });
        parsedInput = {};
      }
    }

    const now = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const result = {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      day: days[now.getDay()],
      year: now.getFullYear(),
    };

    logger?.info('🕒 dateTimeTool: Current date/time', { input: parsedInput, result });
    return result;
  },
});