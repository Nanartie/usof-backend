const db = require('./db/db');
const express = require('express');
const bodyParser = require('body-parser');
const User = require('./models/user.js');
const path = require('path');
const nodemailer = require('nodemailer');
const session = require('express-session');
const passport = require('passport');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
require('./additionall/passport')(passport);

app.use(express.json());
app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true,
}));

const routerForAuth = require('./controllers/controllerAuth');
const routerForUsers = require('./controllers/controllerUsers');
const routerForPosts = require('./controllers/controllerPosts');
const routerForCateg = require('./controllers/controllerCateg');
const routerForComm = require('./controllers/controllerComm');

app.use('/api/auth', routerForAuth);
app.use('/api/users', routerForUsers);
app.use('/api/posts', routerForPosts);
app.use('/api/categories', routerForCateg);
app.use('/api/comments', routerForComm);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);  
  console.log(`http://localhost:${port}`);
});