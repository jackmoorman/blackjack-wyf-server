import express, { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import DiscordStrategy from 'passport-discord';
import * as dotenv from 'dotenv';
dotenv.config();
const authRouter = express.Router();
console.log(process.env.DISCORD_CLIENT_ID);
console.log(process.env.DISCORD_CLIENT_SECRET);

// const discordScopes = ['identify', 'email', 'guilds', 'guilds.join'];

// passport.serializeUser((user, done) => {
//   return done(null, user);
// });

// passport.deserializeUser((user, done) => {
//   return done(null);
// });

// passport.use(
//   new DiscordStrategy(
//     {
//       clientID: process.env.DISCORD_CLIENT_ID as string,
//       clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
//       callbackURL: '/auth/discord/callback',
//       scope: discordScopes,
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       return cb(null, profile);
//     }
//   )
// );

authRouter.get('/discord', passport.authenticate('discord'));
authRouter.get(
  '/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: '/login',
  }),
  function (req: Request, res: Response) {
    res.redirect('/dashboard');
  }
);

authRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello From /auth Route!' });
});

export default authRouter;
