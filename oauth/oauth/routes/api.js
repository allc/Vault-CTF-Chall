import { randomBytes } from 'crypto';

import express from 'express';
var router = express.Router();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

router.post('/oauth2/token', async (req, res) => {
  const { client_id, client_secret, grant_type, code, redirect_uri } = req.body;
  let token;
  const tokenExpiresIn = 3600000;
  await prisma.$transaction(async (tx) => {
    const authorizationCode = await tx.AuthorizationCode.findFirstOrThrow({
      where: {
        code: code,
        app: {
          clientId: client_id,
          clientSecret: client_secret,
        },
        //TODO: verify redirect_uri
      },
      include: {
        user: true,
      }
    });
    await tx.AuthorizationCode.deleteMany({
      where: {
        code: code,
        app: {
          clientId: client_id,
          clientSecret: client_secret,
        },
      }
    });
    if (authorizationCode.expire <= new Date(Date.now())) {
      throw new Error('Code expired.');
    }
    token = await tx.token.create({
      data: {
        token: randomBytes(64).toString('hex'),
        expire: new Date(Date.now() + tokenExpiresIn),
        user: {
          connect: {
            id: authorizationCode.user.id,
          }
        }
      }
    });
  });
  res.json({
    access_token: token.token,
    token_type: 'Bearer',
    expires_in: tokenExpiresIn / 1000,
    scope: 'username',
  });
});

router.get('/users/@me', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const accessToken = await prisma.token.findUnique({
    where: {
      token: token
    },
    include: {
      user: true
    }
  });
  if (!accessToken) {
    res.status(400).json({ message: 'Invalid access token.'});
    return;
  }
  if (accessToken.expire <= new Date(Date.now())) {
    res.status(400).json({ message: 'Access token expired.'});
    return;
  }
  res.json({ username: accessToken.user.username });
});

export default router;
