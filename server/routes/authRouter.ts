import express, { Express, Request, Response, NextFunction } from 'express';
const authRouter = express.Router();

authRouter.post('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello From /api/auth Route!' });
});

export default authRouter;
