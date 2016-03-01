'use strict'
var express = require('express');
var images = express.Router();
var bodyParser = require('body-parser');
var session = require('express-session')
var db = require('./../db/pg');

images.use(function(req, res, next) {
  console.log(req.session)
  if (req.session.user) {
    next()
  } else {
    res.status(401).json({succes: false, data: 'not logged in'})
  }
})

images.route('/')
  .get( (req, res) => {
    res.render('images/index.html.ejs');
  })

module.exports = images;
