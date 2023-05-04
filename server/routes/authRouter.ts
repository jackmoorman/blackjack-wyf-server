import express, { Express, Request, Response, NextFunction } from 'express';
const authRouter = express.Router();

authRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello From /auth Route!' });
});

export default authRouter;
