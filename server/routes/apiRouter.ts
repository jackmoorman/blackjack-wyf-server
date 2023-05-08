import express, { Express, Request, Response, NextFunction } from 'express';
const apiRouter = express.Router();

apiRouter.get('/user', (req: Request, res: Response) => {
  console.log(req.user);
});

export default apiRouter;
