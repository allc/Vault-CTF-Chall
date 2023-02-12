import express from 'express';
import { PrismaClient } from '@prisma/client';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import crypto from 'crypto';
import { passwordStrength } from 'check-password-strength'

var router = express.Router();

const prisma = new PrismaClient();

import { doubleCsrf } from 'csrf-csrf';
import { visitApp } from '../bot.js';
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getTokenFromRequest: (req) => req.body['csrftoken'],
  cookieName: 'csrf-protection',
  cookieOptions: {
    secure: false,
  }
});

router.get('/', function (req, res, next) {
  res.render('index.html', {
    username: req.session.username,
  });
});

router.get('/apps', isAuthenticated, async (req, res) => {
  const authorizedApps = await prisma.app.findMany({
    where: {
      tokens: {
        some: {
          user: {
            username: req.session.username
          }
        }
      }
    }
  });
  res.render('apps.html', {
    username: req.session.username,
    authorizedApps: authorizedApps,
  });
});

router.get('/developers/app', isAuthenticated, async (req, res) => {
  const app = await prisma.app.findFirst({
    where: {
      user: {
        username: req.session.username,
      },
    },
    include: {
      redirects: true,
    }
  });
  const csrftoken = generateToken(res);
  if (!app) {
    res.render('developers/create_app.html', {
      username: req.session.username,
      targetUsername: process.env.TARGET_USERNAME,
      csrftoken: csrftoken,
    });
    return;
  }
  res.render('developers/app.html', {
    username: req.session.username,
    app: app,
    oauthApiEndpoint: process.env.OAUTH_API_ENDPOINT,
    targetUsername: process.env.TARGET_USERNAME,
    csrftoken: csrftoken,
  });
});

router.post('/developers/app', doubleCsrfProtection, isAuthenticated, async (req, res) => {
  let app;
  await prisma.$transaction(async (tx) => {
    app = await prisma.app.findFirst({
      where: {
        user: {
          username: req.session.username,
        }
      }
    });
    if (app) {
      throw new Error('Sorry, currently each user can only create one app.');
    }
    app = await prisma.app.create({
      data: {
        clientId: crypto.randomUUID(),
        clientSecret: crypto.randomBytes(64).toString('hex'), //TODO: securely store client secret
        name: req.body.name,
        redirects: {
          create: {
            uri: req.body.redirect,
          }
        },
        user: {
          connect: {
            username: req.session.username,
          }
        }
      }
    });
    res.render('developers/app_created.html', {
      username: req.session.username,
      app: app,
    });
  });
});

router.post('/developers/app/publish', doubleCsrfProtection, isAuthenticated, async (req, res) => {
  if (req.body.action === 'Publish') {
    //TODO: captcha
    await prisma.app.updateMany({
      where: {
        user: {
          username: req.session.username
        }
      },
      data: {
        published: true,
      }
    });
  } else if (req.body.action === 'Unpublish') {
    await prisma.app.updateMany({
      where: {
        user: {
          username: req.session.username
        }
      },
      data: {
        published: false,
      }
    });
  }
  res.redirect('/developers/app');
  if (req.body.action === 'Publish') {
    const app = await prisma.app.findFirst({
      where: {
        user: {
          username: req.session.username,
        }
      },
      include: {
        redirects: true,
      }
    })
    visitApp(app.clientId, app.redirects[0].uri);
  }
});

router.get('/docs', (req, res) =>{
  res.render('docs.html', { username: req.session.username });
});

router.get('/login', function (req, res) {
  if (req.session.username) {
    res.redirect(req.query.redirect || '/');
    return;
  }
  const redirectEncoded = encodeURIComponent(req.query.redirect || '');
  const error = req.flash('error');
  res.render('login.html', { redirect: redirectEncoded, username: req.session.username, error: error });
});
router.post('/login', async function (req, res) {
  const user = await prisma.user.findFirst({
    where: {
      username: req.body.username,
      password: req.body.password,
    }
  });
  if (user) {
    req.session.username = user.username;
    res.redirect(req.query.redirect || '/');
  } else {
    req.flash('error', 'Invalid username or password.')
    let loginRedirect = '/login';
    if (req.query.redirect) {
      loginRedirect += '?redirect=' + encodeURIComponent(req.query.redirect);
    }
    res.redirect(loginRedirect);
  }
});

router.get('/signup', function (req, res) {
  if (req.session.username) {
    res.redirect(req.query.redirect || '/');
    return;
  }
  const redirectEncoded = encodeURIComponent(req.query.redirect || '');
  const error = req.flash('error');
  res.render('signup.html', { redirect: redirectEncoded, username: req.session.username, error: error });
});
router.post('/signup', async function (req, res) {
  let error = null;

  // check if user exists
  let user = await prisma.user.findFirst({
    where: {
      username: req.body.username
    }
  });
  if (user) {
    error = 'User already exists.';
  }

  if (!error) {
    // check password strength
    const strength = passwordStrength(req.body.password).id;
    if (strength < 2) {
      error = 'Password too weak.';
    }
  }

  if (!error) {
    try {
      const user = await prisma.user.create({
        data: {
          username: req.body.username,
          password: req.body.password,
        }
      });
      req.session.username = user.username;
      res.redirect(req.query.redirect || '/');
      return;
    } catch {
      error = 'User already exists.';
    }
  }

  req.flash('error', error)
  let loginRedirect = '/signup';
  if (req.query.redirect) {
    loginRedirect += '?redirect=' + encodeURIComponent(req.query.redirect);
  }
  res.redirect(loginRedirect);
});

router.get('/logout', function(req, res) {
  req.session.username = null;
  res.redirect('/');
})

export default router;
