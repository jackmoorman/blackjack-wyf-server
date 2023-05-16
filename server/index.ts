import express, { Express, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRouter.js';
import apiRouter from './routes/apiRouter.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const clientURL: string = process.env.CLIENT_URL!;

const app: Express = express();
app.use(express.json());
// allows cors for all routes and origins (change for production)
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(cookieParser());
// session middleware
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: false,
    },
  })
);

// passport initialization
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use('/auth', authRouter);
app.use('/api', apiRouter);

// home route, not needed for production
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello From Root Route!' });
});

// catch-all route handler for any requests to an unknown route
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  const err = {
    log: 'Not Found',
    status: 404,
    message: { err: 'Not Found' },
  };
  return next(err);
});

// global error handler
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

// start server
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
