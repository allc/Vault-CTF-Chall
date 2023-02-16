var express = require('express');
var router = express.Router();
require('dotenv').config();
let crypto = require('crypto');

router.get('/', function(req, res, next) {
  res.render('index.html', {
    username: req.session.username,
  });
});

router.get('/login', function(req, res) {
  const { OAUTH_API_ENDPOINT, CLIENT_ID, REDIRECT_URI } = process.env;
  const redirectUrI = encodeURIComponent(REDIRECT_URI);
  const state = crypto.randomBytes(16).toString('hex');
  req.session.state = state;
  const oauthUrl = `${OAUTH_API_ENDPOINT}/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirectUrI}&scope=username&state=${state}`;
  res.redirect(oauthUrl);
});

router.get('/logout', function(req, res) {
  req.session.username = null;
  res.redirect('/');
})

router.get('/flag', function(req, res) {
  if (req.session.username === process.env.CHALLENGE_USERNAME) {
    res.send(process.env.FLAG);
    return;
  } else if (req.session.username) {
    res.status(403).send('Only member of SIGKILL have access to the flag.');
    return;
  } else {
    res.redirect('/login');
    return;
  }
});

router.get('/oauth2/callback', (req, res) => {
  const { OAUTH_API_ENDPOINT_INTRNAL, API_ENDPOINT, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
  //TODO: better handling state
  // More specifically, maybe cancelled authorization should also invalidate the state
  if ((req.query.code || req.query.access_token) && req.query.state !== req.session.state) {
    res.status(400).send('Invalid state.');
    return;
  } else if (req.query.code || req.query.access_token) {
    req.session.state = null;
  }
  if (req.query.code) {
    fetch(OAUTH_API_ENDPOINT_INTRNAL + '/token',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    }).then((r) => r.json()).then((j) => {
      fetch(API_ENDPOINT + '/users/@me', {
        headers: {
          'Authorization': 'Bearer ' + j['access_token'],
        }
      }).then((r) => r.json()).then((j) => {
        req.session.username = j.username;
        res.redirect('/');
        return;
      });
    });
    return;
  } else if (req.query.access_token) {
    fetch(API_ENDPOINT + '/users/@me', {
      headers: {
        'Authorization': 'Bearer ' + req.query.access_token,
      }
    }).then((r) => r.json()).then((j) => {
      req.session.username = j.username;
      res.redirect('/');
      return;
    });
    return;
  }
  res.render('callback.html');
});

module.exports = router;
