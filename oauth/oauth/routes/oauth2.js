import express from 'express';
var router = express.Router();
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

import { doubleCsrf } from 'csrf-csrf';
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getTokenFromRequest: (req) => req.body['csrftoken'],
  cookieName: 'csrf-protection',
  cookieOptions: {
    secure: false,
  }
});

import isAuthenticated from '../middlewares/isAuthenticated.js';

const prisma = new PrismaClient();

router.get('/authorize', isAuthenticated, async (req, res) => {
  const { client_id, response_type, redirect_uri, state, scope } = req.query;
  const app = await prisma.app.findUnique({
    where: {
      clientId: client_id
    },
    select: {
      name: true,
      redirects: {
        select: {
          uri: true
        }
      }
    }
  });
  if (!app) {
    res.send('Unknown application.');
    return;
  }
  const redirects = await app.redirects.map(redirect => redirect.uri);
  if (!redirects.includes(redirect_uri)) {
    res.send('Invalid redirect_uri.');
    return;
  }
  const redirectUrl = new URL(redirect_uri)
  const redirectOrigin = redirectUrl.origin;
  res.render('confirm.html', {
    app: app,
    redirect: redirectOrigin,
    username: req.session.username,
    csrftoken: generateToken(res),
  });
});

router.post('/authorize', doubleCsrfProtection, isAuthenticated, async (req, res) => {
  const { client_id, response_type, redirect_uri, state, scope } = req.query;
  const { decision } = req.body;
  let redirect;
  switch (decision) {
    case 'Authorize':
      switch (response_type) {
        case 'code':
          const codeExpiresIn = 60000;
          const authorizationCode = await prisma.AuthorizationCode.create({
            data: {
              code: randomBytes(32).toString('hex'),
              expire: new Date(Date.now() + codeExpiresIn),
              app: {
                connect: {
                  clientId: client_id,
                }
              },
              user: {
                connect: {
                  username: req.session.username
                }
              },
            }
          });
          redirect = redirect_uri + `?code=${authorizationCode.code}`
          if (state != undefined) {
            redirect += `&state=${encodeURIComponent(state)}`;
          }
          res.redirect(redirect);
          return;
        case 'token':
          const tokenExpiresIn = 3600000;
          const token = await prisma.token.create({
            data: {
              token: randomBytes(64).toString('hex'),
              expire: new Date(Date.now() + tokenExpiresIn),
              user: {
                connect: {
                  username: req.session.username
                }
              },
            }
          });
          redirect = redirect_uri + `#token_type=Bearer&access_token=${token.token}&expires_in=${tokenExpiresIn / 1000}`;
          if (state != undefined) {
            redirect += `&state=${encodeURIComponent(state)}`;
          }
          res.redirect(redirect);
          return;
        default:
          res.send('Unsupported response_type.');
          return;
      }
    case 'Cancel':
      const errorResponse = 'error=access_denied&error_description=The+resource+owner+or+authorization+server+denied+the+request'
      switch (response_type) {
        case 'code':
          res.redirect(redirect_uri + '?' + errorResponse);
          return;
        case 'token':
          res.redirect(redirect_uri + '#' + errorResponse);
          return;
        default:
          res.send('Unsupported response_type.');
          return;
      }
    default:
      res.send('Invalid decision.');
      return;
  }
});

export default router;
