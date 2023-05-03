import express, { Express, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';

// route imports
import authRouter from './routes/authRouter.js';

const app: Express = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

app.use('/api/auth', authRouter);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello From Root Route!' });
});

app.use('*', (req: Request, res: Response, next: NextFunction) => {
  const err = {
    log: 'Not Found',
    status: 404,
    message: { err: 'Not Found' },
  };
  return next(err);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const defaultError = {
    log: 'Express error handler caught unknown middleware error',
    status: 400,
    message: { err: 'An error occurred' },
  };
  const newError = { ...defaultError, ...err };
  console.log(newError);
  return res.status(newError.status).json(newError.message);
});

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
