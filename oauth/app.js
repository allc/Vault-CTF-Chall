import createError from 'http-errors';
import express from 'express';
import path from 'path'
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import nunjucks from 'nunjucks';
import session from 'express-session';
import flash from 'connect-flash';

import router from './routes/index.js';
import oauth2Router from './routes/oauth2.js';
import apiRouter from './routes/api.js';

import { dirname } from 'path';
const __dirname = dirname(import.meta.url);

import * as dotenv from 'dotenv';
dotenv.config();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
nunjucks.configure('views', { express: app });

app.use(logger('dev'));
// app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  name: 'auth-sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(cookieParser());
app.use(flash());

app.use('/', router);
app.use('/oauth2', oauth2Router);
app.use('/api', apiRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error.html');
// });

export default app;
