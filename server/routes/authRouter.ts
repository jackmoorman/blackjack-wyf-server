import express, { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { prisma } from '../../lib/prisma.js';
import authController from '../controllers/authController.js';
import * as dotenv from 'dotenv';
dotenv.config();

const clientURL: string = process.env.CLIENT_URL!;
const authRouter = express.Router();

passport.serializeUser((user, done) => {
  console.log('Serializing User: ', user);
  done(null, user);
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
      console.log('Error retrieving user while deserializing: ', err);
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
        console.log('USER: ', user);
        return cb(null, user);
      } catch (err: any) {
        return cb(err);
      }
    }
  )
);

authRouter.get('/discord', passport.authenticate('discord'));
authRouter.get(
  '/discord/callback',
  passport.authenticate('discord', {
    session: true,
    failureRedirect: `${clientURL}/login`,
  }),
  (req: Request, res: Response) => {
    console.log('REQ.USER: ', req.user);
    res.redirect(`${clientURL}`);
  }
);

authRouter.get('/verify', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.user) res.status(200).json({ isAuthenticated: true, user: req.user });
  else res.status(200).json({ isAuthenticated: false, user: null });
});

authRouter.get('/logout', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.user) {
    req.logout((err) => {
      if (err)
        return res
          .status(300)
          .json({ success: false, message: `Error loggin out: ${err}` });

      return res
        .status(200)
        .json({ success: true, message: 'Successfully logged out.' });
    });
  } else {
    return res
      .status(300)
      .json({ success: false, message: 'User is not logged in.' });
  }
});

export default authRouter;
