# Authentication with Express & Bcrypt & PG
- adapted from
https://github.com/ajbraus/wdi-homework/blob/master/express-auth-bcrypt.md

| Objectives |
| :--- |
| Implement a password **authentication** strategy with bcrypt |
| Saved a logged-in user's data to the session |
| Implement routes for a user to `signup`, `/login`, and `/logout` |
| Apply session data in views|


## Authentication & Authorization

* **Authentication** verifies that a user is who they say they are. When a user logs into our site, we *authenticate* them by checking that the password they typed in matches the password we have stored for them.
* **Authorization** is the process of determining whether or not a user has *permission* to to perform certain actions on our site. For example, a user may *be authorized* to view their profile page and edit their own blog posts, but not to edit another user's blog posts.

## Why do we hash (and salt) passwords?

In order to authenticate a user, we need to store their password in our database. This allows us to check that the user typed in the correct password when logging into our site.

The downside is that if anyone ever got access to our database, they would also have access to all of our users' login information. We use a <a href="https://crackstation.net/hashing-security.htm#normalhashing" target="_blank">hashing algorithm</a> to avoid storing plain-text passwords in the database. We also use a <a href="https://crackstation.net/hashing-security.htm#salt" target="_blank">salt</a> to randomize the hashing algorithm, providing extra security against potential attacks.

![](http://memeshare.net/memes/1/604.png)

## Implementing Authentication

To give users the ability to sign up and log in to our site, we'll need:

* **Express:** for building our application and handling requests
* **Middleware:**
  * `body-parser`: for handling incoming form data
  * `express-session`: for setting sessions and cookies
  * `connect-pg-simple`: connect sessions to pg
  *
* **A users table in pg:** for CRUD-ing users and setting up authentication methods
* ** A sessions table:** set up by connect-pg-simple
* <a href="https://github.com/ncb000gt/node.bcrypt.js" target="_blank">**bcrypt:**</a> for hashing users' passwords

## Challenges: Part 1

**Goal:** Setup project from starter code.

1. Pull from upstream, cd into the example application in classwork for today

3. Create the appropriate database name and connection string in pg.js

4. Create a users table that has an email and a password_digest (both strings)


6. Add a home route to `server.js` which renders `home.html.ejs` which has an anchor tag, signup that links to `/users/new` with text of `Signup`.

7. in the routes directory with a file users.js
  ```
  var express = require('express');
  var users = express.Router();
  var bodyParser = require('body-parser');
  var db = require('./../db/pg');
  ```

  Add the corresponding code in your server.js

  ```
  var userRoutes = require( path.join(__dirname, '/routes/users'));

  [...]

  app.use('/users', userRoutes)
  ```

  - define a route in this file. A get route `/users/new`

  ```
  users.get('/new', (req,res) => {
    res.render('users/new.html.ejs')
  })
  ```
  - the new route will render a file from `views/users` called `new.html.ejs` which will have a form with two input fields

  The form will make a post request to `/users`

  ```
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Document</title>
  </head>
  <body>
    <form action="/users" method="post">
      <label for="email">email</label>
      <input type="text" name="email">
      <label for="password">password</label>
      <input type="text" name="password">

      <input type="submit" value="Submit">
    </form>
  </body>
  </html>
  ```

## Challenges: Part 2

So we now have the beginning of our signup flow but nothing his happening yet. Remember when we installed bcrypt earlier? We're going to now use that to save our users data to the db and "sign them up" for our application.

**Goal:** Set up bcrypt to hash our password and save that hashed password to the db

1. Install bcrypt and add it to pj.js

  ```
  $ npm install bcrypt --save

  ```
  - at the top of pj.js add
  ```
  var bcrypt = require('bcrypt');
  ```

  What is salting?

1. Create a function called createUser that takes req, res, and next as arguments. Inside of that function create a function saveUser that takes two arguments, email and hash. Build the saveUser function as a standard pg function, It will insert an email and a password_digest into users.

```
function createUser(req, res, next) {
  createSecure(req.body.email, req.body.password, saveUser);

  function saveUser(email, hash) {
    // Get a Postgres client from the connection pool
    pg.connect(connectionString, function(err, client, done) {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({ success: false, data: err});
      }

      var query = client.query("INSERT INTO users (email, password_digest) VALUES ($1, $2);",
        [email, hash], function(err, result) {
          done()
          if(err) {
            return console.error('error, running query', err);
          }
          next()
      });
    });
  }
}
```

2. TOGETHER: build the createSecure function, explain how we call it as a callback.

  - add this line to the top

  ```
  var salt = bcrypt.genSaltSync(10);
  ```

  ```
  function createSecure(email, password, callback) {
    // hash password user enters at sign up
    bcrypt.genSalt(function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        // this callback saves the user to our database with the hashed password
        callback(email, hash)
      });
    });
  };
  ```
  now call that function in the first line of create user, pass in the body, and a reference to saveUser as the callback

3. so let's go line by line and see what happens. We can now save users to our database and the password that is saved is encrypted.

4. make the corresponding post route in users.js that calls createUser and authenticates them it should redirect to the home page.

```
users.route('/')
  .post(db.createUser, (req, res) => {
    res.redirect('/');
  })
  ```

## Challenges: Part 3 Log in

1. Create a log in anchor tag on our home page that links to `users/login` it should render `users/login.html.ejs` which has a form that makes a post request with email and password.

```
users.get('/login', (req,res) => {
  res.render('users/login.html.ejs')
})
```

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document</title>
</head>
<body>
  <form action="/users/login" method="post">
    <label for="email">email</label>
    <input type="text" name="email">
    <label for="password">password</label>
    <input type="text" name="password">

    <input type="submit" value="Submit">
  </form>
</body>
</html>
```

2. Cool so this post request goes no where let's build this part out together.

### What are sessions?

npm install express-session --save
npm install connect-pg-simple --save

psql sessions_test < node_modules/connect-pg-simple/table.sql

add the following to server.js

```
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);

app.use(session({
  store: new pgSession({
    pg : pg,
    conString : connectionString,
    tableName : 'session'
  }),
  secret: 'sooosecrett', // something we maybe want to save with dotenv *hint hint*
  resave: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}))
```

Add to pg.js
```
var session = require('express-session')
```

```
function loginUser(req, res, next) {
  var email = req.body.email;
  var password = req.body.password;

  // find user by email entered at log in
  pg.connect(connectionString, function(err, client, done) {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      res.status(500).json({ success: false, data: err});
    }

    var query = client.query("SELECT * FROM users WHERE email LIKE ($1);",
      [email], function(err, result) {
        done()
        if(err) {
          return console.error('error, running query', err);
        }

        if (result.rows.length == 0) {
          res.status(204).json({success: false, data: 'no account matches that password'})
        } else if (bcrypt.compareSync(password, result.rows[0].password_digest)) {
          res.rows = result.rows[0]
          next()
        }
    });
  });
}
```


```
users.post('/login', db.loginUser, (req, res) => {
    req.session.user = res.rows

    // when you redirect you must force a save due to asynchronisity
    // https://github.com/expressjs/session/issues/167 **
    // "modern web browsers ignore the body of the response and so start loading
    // the destination page well before we finished sending the response to the client."

    req.session.save(function() {
      res.redirect('/')
    })
})
```

3. So it appears to be working, how can we check?
  - we can check the sessions table
  - we can also render a dynamic welcome message on the home page based on who is logged in!

  add the object req.session.user object to the view!

  ```
  app.get('/', function(req, res) {
    res.render('home.html.ejs', { user: req.session.user})
  })
  ```

  ```
  <% if (user) {%>
    <h3>Welcome <%= user.email %></h3>
  <% } %>
  ```

## Challenges: Part 4 logout

**Goal:** Add a route to log a user out

1. Add a delete route /logout to users.js
2. Install method override
3. Add a form/button on the home page that links to that delete route

What is that delete route going to delete? The user? what?
Answer: the session!

```
<div>
  <form method="post" action="users/logout?_method=DELETE">
    <button>logout</button>
  </form>
</div>
```

```
users.delete('/logout', (req,res) => {
  req.session.destroy(function(err) {
    res.redirect('/')
  })
})
```


## Challenges: Part 5 How do we restrict routes?

**Goal:**

1. create an image router an image view index.html.ejs that just

We need to check and see if there is a session, if there is, great! next()
if not throw an error.

```
images.use(function(req, res, next) {
  console.log(req.session)
  if (req.session.user) {
    next()
  } else {
    res.status(301).json({succes: false, data: 'not logged in'})
  }
})```
