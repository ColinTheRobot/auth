var pg = require('pg');
var connectionString = "postgres://generalassembly:generalassembly@localhost/sessions_test";
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);
var session = require('express-session');


function loginUser(req, res, next) {
    var email = req.body.email;
    var password = req.body.password;

    pg.connect(connectionString, function(err, client, done) {
      if (err) {
        done()
        console.log(err)
        return res.status(500).json({success: false, data: err})
      }

      var query = client.query("SELECT * FROM users WHERE email LIKE ($1);", [email], function(err, results) {
        done()
        if (err) {
          return console.error('error running query', err)
        }

        if (results.rows.length === 0) {
          res.status(204).json({success: true, data: 'no content'})
        } else if (bcrypt.compareSync(password, results.rows[0].password_digest)) {
          res.rows = results.rows[0]
          next()
        }
      })
    })
}

function createSecure(email, password, callback) {
  // hashing the password given by the user at signup
  bcrypt.genSalt(function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
      // this callback saves the user to our databased
      // with the hashed password

      // saveUser(email, hashed)
      callback(email, hash)
    })
  })
}


function createUser(req, res, next) {
  createSecure(req.body.email, req.body.password, saveUser);

  function saveUser(email, hash) {
    pg.connect(connectionString, function(err, client, done) {
      if (err) {
        done()
        console.log(err)
        return res.status(500).json({success: false, data: err})
      }

      var query = client.query("INSERT INTO users( email, password_digest) VALUES ($1, $2);", [email, hash], function(err, result) {
        done()
        if (err) {
          return console.error('error running query', err)
        }
        next()
      })
    })
  }
}

module.exports.createUser = createUser;
module.exports.loginUser = loginUser;
