import express from 'express';
import { PrismaClient } from '@prisma/client';

var router = express.Router();

const prisma = new PrismaClient();

router.get('/', function(req, res, next) {
  res.render('index.html');
});

router.get('/login', function(req, res) {
  const redirect = req.query.redirect;
  const error = req.flash('error');
  res.render('login.html', { redirect: redirect, error: error });
});
router.post('/login', async function(req, res) {
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
      loginRedirect += '?redirect=' + req.query.redirect;
    }
    res.redirect(loginRedirect);
  }
});

router.get('/signup', function(req, res) {
  const redirect = req.query.redirect;
  res.render('signup.html', { redirect: redirect });
});
router.post('/signup', async function (req, res) {
  try {
    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        password: req.body.password,
      }
    });
    req.session.username = user.username;
    res.redirect(req.query.redirect || '/');
  } catch {
    req.flash('error', 'User already exists.')
    let loginRedirect = '/signup';
    if (req.query.redirect) {
      loginRedirect += '?redirect=' + req.query.redirect;
    }
    res.redirect(loginRedirect);
  }
});

export default router;
