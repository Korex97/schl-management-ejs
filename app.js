const express = require('express');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const breadcrumb = require('express-url-breadcrumb');
const multer = require('multer');
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const ejs = require("ejs");

const port = process.env.PORT || 4000;
require('dotenv').config();

const app = express();

// Load Routes
const students = require('./routes/students');
const users = require('./routes/users');
const courses = require('./routes/courses');
const fees = require('./routes/fee-mgmt');
const api = require('./routes/api');
const uploads = require('./routes/uploads');

// Passport Config.
require('./config/passport')(passport);

// Connecting to MongoDB...
var uri = "mongodb+srv://schl-info-system:school@cluster0.morsc.mongodb.net/schl-info-system?retryWrites=true&w=majority"
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
    .then( () => console.log("Database Connected"))
    .catch( err => console.log(err));
var database = mongoose.connection;
database.on("error", console.error.bind(console, "Mongoose Connection Error"));
database.once('open', () => {
  console.log("MongoDB daatabase connection established successfully");
});



// Load Helpers
const {
    paginate,
    select,
    if_eq,
    select_course
} = require('./helpers/customHelpers');

const {
    ensureAuthenticated,
    isLoggedIn
} = require('./helpers/auth');


app.use(expressLayouts);
app.set("layout", "./layouts/main")
app.set('view engine', 'ejs');

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express URL Breadcrumbs
app.use(breadcrumb());

// Body Parser Middleware
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

// Method Override
app.use(methodOverride('_method'));

// Express Session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Passport Middleware.
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Global Variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.user = req.user || null;
    next();
});

// Home Route
app.get('/', [isLoggedIn], (req, res) => {
    res.render('home', {
        title: 'Welcome',
        breadcrumbs: false,
        layout: './layouts/home'
    });
});

// Dashboard Route
app.get('/dashboard', [ensureAuthenticated], (req, res) => {
    //console.log(req.originalUrl);
    res.render('dashboard', {
        title: 'Dashboard',
        breadcrumbs: true
    });
});

app.get('/api', (req, res) => {
    res.render('api');
})

app.get('/errors', (req, res) => {
    res.render('errors', {
        title: '404 - Page Not Found.'
    });
});

// Use Routes
app.use('/students', students);
app.use('/users', users);
app.use('/courses', courses);
app.use('/fee-management', fees);
app.use('/api', api);
app.use('/uploads', uploads);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
        res.render('errors');
    });

app.listen(port, () => console.info(`Listening to port ${port}`));


