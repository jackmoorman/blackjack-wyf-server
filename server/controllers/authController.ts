import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { Profile as DiscordProfile } from 'passport-discord';

const authController = {
  findOrCreate: async (profile: DiscordProfile) => {
    try {
      const discord_id = profile.id;
      const user = await prisma.user.findUnique({ where: { discord_id } });
      if (!user) {
        const { email, username } = profile;
        const newUser = await prisma.user.create({
          data: {
            discord_id,
            email: email!,
            username,
            Blackjack: {
              create: {},
            },
          },
        });
        return newUser;
      }
      return user;
    } catch (err) {
      throw new Error(`Error getting user: ${err}`);
    }
  },
};

export default authController;
