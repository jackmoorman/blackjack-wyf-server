import express, { Express, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
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
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: {
      sameSite: 'none',
      secure: true,
      maxAge: 1000 * 60 * 60 * 24, // One day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  console.log('Serializing User: ', user);
  return done(null, user);
});

passport.deserializeUser(async (id: string, done) => {
  console.log('Deserializing User: ', id);
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    console.log('Found user: ', user);
    return done(null, user);
  } catch (err) {
    return done(err);
  }
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
    res.redirect(`${clientURL}`);
  }
);

app.get('/auth/logout', (req, res) => {
  console.log('LOGOUT: ', req.user);
  console.log(req.session.destroy);
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
