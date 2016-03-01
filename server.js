var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var pg = require('pg');
var connectionString = "postgres://generalassembly:generalassembly@localhost/sessions_test";
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);
var path = require('path');
var methodOverride = require('method-override');
pry = require('pryjs')

var db = require('./db/pg');
var app = express();

var userRoutes = require( path.join(__dirname, '/routes/users'));
var imageRoutes = require( path.join(__dirname, '/routes/images'));

app.use(session({
  store: new pgSession({
    pg : pg,
    conString : connectionString,
    tableName : 'session'
  }),
  secret : 'soooosecreetttt',
  resave : false,
  cookie : { maxAge : 30 * 24 * 60 * 60 * 1000 } // 30 days
}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('short'));

app.use(methodOverride('_method'))

app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', function(req, res) {
  res.render('home.html.ejs', { user : req.session.user});
})

app.use('/users', userRoutes)
app.use('/images', imageRoutes)




var port = process.env.PORT || 3000;
var server = app.listen(port)
