import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from './api/routes';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' })); // Allow up to 10mb for context pushes (limit is 500kb but we allow more)

app.use('/v1', apiRouter);

// Catch malformed JSON centrally
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ accepted: false, reason: 'malformed_json' });
  }
  next();
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vera Engine Server running on port ${PORT}`);
});
