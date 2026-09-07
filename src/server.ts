import express, { Request, Response, NextFunction } from 'express';
import { MastraServer } from '@mastra/express';
import { mastra } from '@/mastra';
import CONFIG from '@config/config';

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 AGENT REQUEST');
  console.log('Time:', new Date().toISOString());
  console.log('Message:', JSON.stringify(req.body, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━');
  next();
});

const server = new MastraServer({ app, mastra });

await server.init();

app.get('/health', (req: Request, res: Response, next: NextFunction) => {
  const mastraInstance = res.locals.mastra;
  const agents = Object.keys(mastraInstance.listAgents());
  res.json({ status: 'ok', agents });
});

app.listen(CONFIG.PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${CONFIG.PORT} (listening on all interfaces)`);
  console.log(`Try: curl http://<host-ip>:${CONFIG.PORT}/api/agents  # replace <host-ip> with server IP`);
});