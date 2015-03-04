'use strict';

//var bodyParser = require('body-parser');
var config = require('config');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('lib/mongoose');

var express = require('express');
var app = express();

//app.use(express.compress());

app.set('views', __dirname + '/templates');
app.set('view engine', 'jade');

//simple log
app.use(function(req, res, next) {
    console.log(Date.now() + ": requested source - " + req.url);
    next();
});

app.use(session({
    secret           : config.get("session:secret"),
    name             : config.get("session:name"),
    resave           : config.get("session:resave"),
    saveUninitialized: config.get("session:saveUninitialized"),
    store            : new MongoStore({mongooseConnection: mongoose.connection})
}));

//session test
app.use('/st', function(req, res) {
    req.session.myCount = req.session.myCount + 1 || 1;
    res.send("Count = " + req.session.myCount);
});

//use routes for login, registration and etc.
var authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

var projectsRoutes = require('./routes/projectsRoutes');
app.use('/', projectsRoutes);

//тест обработчика ошибок
app.use('/forbidden', function(req, res, next) {
    next(new Error('Forbidden url'));
});

app.use(express.static(__dirname + '/app'));

app.use('/', function(req, res) {
    res.render('main.jade', {user: req.session.user_id});
});


//Выполняется в том случае, когда не было найдено других вариантов
app.use(function(req, res){
    res.status(404);
    console.log('Not found URL: ' + req.url);
    res.send({error: 'Not Found :( so sad...'});
});

//обработчик ошибок типа next(new Error('error description'));
app.use(function (err, req, res, next) {
    res.status(500).send('Internal server error: ' + err);
});

app.listen(config.get("port"), function() {
    console.log("Server is running on port " + config.get("port"));
});