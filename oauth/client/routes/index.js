var express = require('express');
var router = express.Router();
require('dotenv').config();

router.get('/', function(req, res, next) {
  const {OAUTH_API_ENDPOINT, CLIENT_ID, REDIRECT_URI } = process.env;
  const redirectUrI = encodeURIComponent(REDIRECT_URI);
  const oauthUrl = `${OAUTH_API_ENDPOINT}/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirectUrI}&scope=username`
  res.render('index.html', {
    oauthUrl: oauthUrl,
    username: req.session.username,
    owner: process.env.TARGET_USERNAME,
    flag: process.env.FLAG,
  });
});

router.get('/oauth2/callback', (req, res) => {
  const {API_ENDPOINT, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
  if (req.query.code) {
    fetch(API_ENDPOINT + '/oauth2/token',{
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
