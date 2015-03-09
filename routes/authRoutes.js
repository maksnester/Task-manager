'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var authRoutes = express.Router();
//var mongoose = require('lib/mongoose');
var User = require('models/user').User;

//SIGN IN page
authRoutes.use('/signin', function (req, res) {
    if (req.session.user_id) res.redirect('/projects');
    res.render('signin.jade', {page_title: "Sign in"});
});

//REGISTER page
authRoutes.use('/register', function (req, res) {
    if (req.session.user_id) res.redirect('/projects');
    res.render('register.jade', {page_title: "Register", user: req.session.user_id});
});

//LOGOUT action
authRoutes.use('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

//запрос на создание нового пользователя
authRoutes.post('/newUser', bodyParser.urlencoded({extended: false}), createNewUser);

//запрос входа по логину и паролю
authRoutes.post('/login', bodyParser.urlencoded({extended: false}), login);



//запрос на проверку email при регистрации
authRoutes.post('/checkEmail', bodyParser.urlencoded({extended: false}), checkEmail);




/**
 * Функция, создающая нового пользователя.
 * @param req JSON с параметрами email, password, name
 * @param res
 * @param next
 */
function createNewUser(req, res, next) {
    console.log('Try sign up with: %j', req.body);

    var newUser = new User({
        email   : req.body.email,
        password: req.body.password,
        name    : req.body.name
    });

    newUser.save(function(err) {
        if (err) return next(err);
        res.redirect('/signin?newreg');
    });
}

/**
 * Функция для запроса входа пользователя в систему
 * @param req
 * @param res
 * @param next
 */
function login(req, res, next) {
    var email = req.body.email;
    var password = req.body.password;
    if (email && password) {
        User.findOne({email: email}, function(err, user) {
            if (err) {
                console.error("Error while email validation: " + err);
                return next(err);
            }
            if (user) { //нашли пользователя проверим пароль
                if (user.checkPassword(password)) {
                    //всё ок, записать в сессию user_id и редирект в мои проекты
                    req.session.user_id = user._id;
                    res.redirect('/projects');
                } else {
                    res.render('signin.jade', {authError: true});
                }
            }
        });
    }
}

/**
 * Ищет по базе указанный email.
 * @param req JSON с параметром email
 * @param res
 * @param next
 */
function checkEmail(req, res, next) {
    if (req.body.email) {
        User.findOne({email: req.body.email}, function(err, result) {
            if (err) {
                console.error("Error while email validation: " + err);
                return next(err);
            }
            if (result) res.status(200).json({exists: true}); //user already exists
            else res.status(200).json({exists: false}); // такого пользователя нет - всё ок.
        });
    }
}

module.exports = authRoutes;

/**
 * Функция проверки авторизации. Если пользователь авторизован, то у него в сессии лежит его идентификатор
 * @param req
 * @param res
 * @param next
 */
var checkAuth = function (req, res, next) {
    if (req.session.user_id) {
        User.findById(req.session.user_id, function(err, user) {
            if (err) return next(err);
            if (user) {
                req.currentUser = user; // сохраняем пользователя для дальнейших обработчиков запроса req
                next();
            } else {
                res.status(403).redirect('/signin');
            }
        });
    } else res.redirect('/signin');
};
module.exports.checkAuth = checkAuth;

