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
  const myApps = await prisma.app.findMany({
    where: {
      user: {
        username: req.session.username,
      }
    }
  });
  res.render('apps.html', {
    username: req.session.username,
    authorizedApps: authorizedApps,
    myApps: myApps,
  });
});

router.get('/apps/create', isAuthenticated, async (req, res) => {
  const csrftoken = generateToken(res);
  res.render('create_app.html', {
    username: req.session.username,
    csrftoken: csrftoken,
  });
});

router.post('/apps/create', doubleCsrfProtection, isAuthenticated, async (req, res) => {
  let app;
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
  res.render('app_created.html', {
    username: req.session.username,
    app: app,
  });
});

router.get('/apps/:clientId', isAuthenticated, async (req, res) => {
  const clientId = req.params.clientId;
  const app = await prisma.app.findUnique({
    where: {
      clientId: clientId,
    },
    include: {
      redirects: true,
      user: true,
    }
  });
  if (!app || app.user.username !== req.session.username) {
    res.status(403).send('Forbidden');
    return;
  }
  const csrftoken = generateToken(res);
  res.render('app.html', {
    username: req.session.username,
    app: app,
    oauthApiEndpoint: process.env.OAUTH_API_ENDPOINT,
    csrftoken: csrftoken,
  });
});

router.post('/apps/:clientId', doubleCsrfProtection, isAuthenticated, async (req, res) => {
  const clientId = req.params.clientId;
  const app = await prisma.app.findUnique({
    where: {
      clientId: clientId,
    },
    include: {
      user: true,
    }
  });
  if (!app || app.user.username !== req.session.username) {
    res.status(403).send('Forbidden');
    return;
  }
  await prisma.app.update({
    where: {
      clientId: clientId,
    },
    data: {
      name: req.body.name,
      redirects: {
        updateMany: {
          where: {}, // this "where" is needed, see https://github.com/prisma/prisma/issues/7248#issuecomment-850152638
          data: {
            uri: req.body.redirect,
          }
        }
      },
    },
  });
  res.redirect('/apps/' + clientId);
});

router.post('/apps/:clientId/reset-secret', doubleCsrfProtection, isAuthenticated, async (req, res) => {
  const clientId = req.params.clientId;
  const app = await prisma.app.findUnique({
    where: {
      clientId: clientId,
    },
    include: {
      user: true,
    }
  });
  if (!app || app.user.username !== req.session.username) {
    res.status(403).send('Forbidden');
    return;
  }
  await prisma.app.update({
    where: {
      clientId: clientId,
    },
    data: {
      clientSecret: crypto.randomBytes(64).toString('hex'),
    },
  });
  res.render('reset_secret.html', {
    username: req.session.username,
    app: app,
  });
});

router.post('/apps/:clientId/publish', doubleCsrfProtection, isAuthenticated, async (req, res) => {
  const clientId = req.params.clientId;
  const app = await prisma.app.findUnique({
    where: {
      clientId: clientId,
    },
    include: {
      redirects: true,
      user: true,
    }
  });
  if (!app || app.user.username !== req.session.username) {
    res.status(403).send('Forbidden');
    return;
  }

  if (req.body.action === 'Publish') {
    //TODO: rate limit
    await prisma.app.update({
      where: {
        id: app.id,
      },
      data: {
        published: true,
      }
    });
  } else if (req.body.action === 'Unpublish') {
    await prisma.app.update({
      where: {
        id: app.id,
      },
      data: {
        published: false,
      }
    });
  }
  res.redirect('/apps/' + clientId);

  if (req.body.action === 'Publish') {
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
