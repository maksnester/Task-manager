'use strict';

var express = require('express');
var projectsRoutes = express.Router();
//var mongoose = require('lib/mongoose');
var checkAuth = require('routes/authRoutes').checkAuth;



projectsRoutes.use('/projects', checkAuth, function(req, res) {
   res.render('projects.jade');
});

module.exports = projectsRoutes;