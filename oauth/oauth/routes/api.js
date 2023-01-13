import { randomBytes } from 'crypto';

import express from 'express';
var router = express.Router();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

router.get('/users/@me', async (req, res) => {
  if (!req.headers.authorization) {
    res.status(403).json({ message: 'Authorization required.'});
    return;
  }
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
