import express, { Express, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import apiRouter from './routes/apiRouter.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  return done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log('deserializeUser', user);
  return done(null);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    function (_, __, profile, cb) {
      console.log('CallbackURL reached', profile);
      return cb(null, profile);
    }
  )
);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      callbackURL: '/auth/discord/callback',
      scope: ['identify', 'email', 'guilds', 'guilds.join'],
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log('Discord callback URL: ', profile);
      return cb(null, profile);
    }
  )
);

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:3000',
    session: true,
  }),
  function (req, res) {
    console.log('Google callback reached at /auth/google/callback');
    res.status(200).json({ message: 'Successfully logged in with Google' });
  }
);

app.get('/auth/discord', passport.authenticate('discord'));
app.get(
  '/auth/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: '/',
  }),
  function (req, res) {
    res.redirect('/');
  }
);

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
