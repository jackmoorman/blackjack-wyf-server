import express, { Express, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import passport from 'passport';
import DiscordStrategy from 'passport-discord';
import session from 'express-session';

// route imports
import authRouter from './routes/authRouter.js';
import apiRouter from './routes/apiRouter.js';

const app: Express = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: 'none',
      secure: true,
      maxAge: 1000 * 60 * 60 * 24, // One day
    },
  })
);

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

const PORT = process.env.PORT || 3002;

app.use('/auth', authRouter);
app.use('/api', apiRouter);

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
