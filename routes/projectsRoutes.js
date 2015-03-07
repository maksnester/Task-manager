'use strict';

var express = require('express');
var projectsRoutes = express.Router();
//var mongoose = require('lib/mongoose');
var checkAuth = require('routes/authRoutes').checkAuth;



projectsRoutes.use('/projects', checkAuth, function(req, res) {

   var tempProjectList = [
      {
         lastModified: new Date('03.15.2014').shortDate(),
         title: "Some project title e.g. Chat-po-11",
         tasks: 150,
         completed: 106,
         timeSpent: '6w 4d 23h',
         members: 7
      },
      {
         lastModified: new Date('10.01.2015').shortDate(),
         title: "Task-manager project",
         tasks: 35,
         completed: 4,
         timeSpent: '1w 1d 12h',
         members: 7
      },
      {
         lastModified: new Date().shortDate(),
         title: "Simple web-site",
         tasks: 9,
         completed: 8,
         timeSpent: '1d 3h',
         members: 7
      },
      {
         lastModified: new Date('06.03.2015').shortDate(),
         title: "Cool site for my favorite customer",
         tasks: 16,
         completed: 16,
         timeSpent: '4d 23h',
         members: 7
      },
      {
         lastModified: new Date('03.15.2014').shortDate(),
         title: "Some project title e.g. Chat-po-11",
         tasks: 150,
         completed: 106,
         timeSpent: '6w 4d 23h',
         members: 7
      },
      {
         lastModified: new Date('10.01.2015').shortDate(),
         title: "Task-manager project",
         tasks: 35,
         completed: 4,
         timeSpent: '1w 1d 12h',
         members: 7
      },
      {
         lastModified: new Date().shortDate(),
         title: "Simple web-site",
         tasks: 9,
         completed: 8,
         timeSpent: '1d 3h',
         members: 7
      },
      {
         lastModified: new Date('06.03.2015').shortDate(),
         title: "Cool site for my favorite customer",
         tasks: 16,
         completed: 16,
         timeSpent: '4d 23h',
         members: 7
      },
      {
         lastModified: new Date('03.15.2014').shortDate(),
         title: "Some project title e.g. Chat-po-11",
         tasks: 150,
         completed: 106,
         timeSpent: '6w 4d 23h',
         members: 7
      },
      {
         lastModified: new Date('10.01.2015').shortDate(),
         title: "Task-manager project",
         tasks: 35,
         completed: 4,
         timeSpent: '1w 1d 12h',
         members: 7
      },
      {
         lastModified: new Date().shortDate(),
         title: "Simple web-site",
         tasks: 9,
         completed: 8,
         timeSpent: '1d 3h',
         members: 7
      },
      {
         lastModified: new Date('06.03.2015').shortDate(),
         title: "Cool site for my favorite customer",
         tasks: 16,
         completed: 16,
         timeSpent: '4d 23h',
         members: 7
      }
   ];
   res.render('projects.jade', {user: req.session.user_id, projects: tempProjectList});
});

module.exports = projectsRoutes;