import express, { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import session from 'express-session';
import * as dotenv from 'dotenv';
dotenv.config();

const clientURL: string = process.env.CLIENT_URL!;
const authRouter = express.Router();

passport.serializeUser((user, done) => {
  return done(null, user);
});

passport.deserializeUser((id: string, done) => {
  console.log('deserializeUser', id);
  return done(null, id);
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

authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile'] })
);

authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${clientURL}/login`,
    session: true,
  }),
  function (req, res) {
    console.log('Google callback reached');
    // res.status(200).json({ message: 'Successfully logged in using Google' });
    res.redirect(`${clientURL}`);
  }
);

authRouter.get('/discord', passport.authenticate('discord'));

authRouter.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  function (req, res) {
    console.log('Discord callback reached');
    res.status(200).json({ message: 'Successfully logged in using Discord' });
  }
);

authRouter.get('/logout', (req: Request, res: Response) => {
  // req.logout();
});

export default authRouter;
