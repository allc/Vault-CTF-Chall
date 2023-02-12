import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import * as dotenv from 'dotenv'
dotenv.config()

try{
  await prisma.user.create({
    data: {
      username: process.env.TARGET_USERNAME,
      password: process.env.PASSWORD,
    }
  });
} catch {

}

try {
  await prisma.app.create({
    data: {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      name: process.env.APP_NAME,
      user: {
        connect: {
          username: process.env.TARGET_USERNAME
        }
      }
    }
  });
} catch {

}

try {
  await prisma.redirect.create({
    data: {
      uri: process.env.REDIRECT,
      app: {
        connect: {
          clientId: process.env.CLIENT_ID
        }
      }
    },
  })
} catch(e) {
  console.log(e);
}