import express, { Express, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRouter.js';
import apiRouter from './routes/apiRouter.js';
import { Strategy as DiscordStrategy } from 'passport-discord';
import authController from './controllers/authController.js';
import { prisma } from '../lib/prisma.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const clientURL: string = process.env.CLIENT_URL!;

const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
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

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  console.log('Serializing User: ', user);
  done(null, user);
  // removed return
});

passport.deserializeUser(async (authUser: any, done) => {
  console.log('Deserializing User: ', authUser);
  const user = await prisma.user
    .findUnique({
      where: {
        id: authUser.id,
      },
    })
    .catch((err) => {
      console.log('Error retrieving user: ', err);
      return done(err, null);
    });

  if (!user) return done(null, null);
  console.log('Found user: ', user);
  return done(null, user);
});

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      callbackURL: '/auth/discord/callback',
      scope: ['identify', 'email'],
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log('Discord Strategy callback reached: ', profile);
      try {
        const user = await authController.findOrCreate(profile);
        return cb(null, user);
      } catch (err: any) {
        return cb(err);
      }
    }
  )
);

app.use('/api', apiRouter);

app.get('/auth/discord', passport.authenticate('discord'));
app.get(
  '/auth/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: '/login',
    session: true,
  }),
  (req: Request, res: Response) => {
    console.log('REQ.USER: ', req.user);
    res.redirect(`${clientURL}`);
  }
);

app.get('/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  console.log('LOGOUT: ', req.user);
  console.log('Session: ', req.session);
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err)
        return res
          .status(300)
          .json({ success: false, message: 'Error logging out' });

      return res
        .status(200)
        .json({ success: true, message: 'Successfulle logged out' });
    });
  } else {
    return res.status(300).json({ success: false, message: 'Not logged in' });
  }
});

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
