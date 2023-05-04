import express, { Express, Request, Response, NextFunction } from 'express';
const apiRouter = express.Router();

apiRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello From /api Route!' });
});

export default apiRouter;
