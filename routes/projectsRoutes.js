'use strict';

var express = require('express');
var projectsRoutes = express.Router();
//var mongoose = require('lib/mongoose');
var checkAuth = require('routes/authRoutes').checkAuth;
var Project = require('models/project').Project;

//lastModified: new Date('03.15.2014').shortDate(),
//    title: "Some project title e.g. Chat-po-11",
//    tasks: 150,
//    completed: 106,
//    timeSpent: '6w 4d 23h',
//    members: 7

projectsRoutes.use('/projects', checkAuth, function(req, res, next) {

   Project.find({_owner: req.session.user_id}, function(err, result) {
      if (err) {
         console.log("Error when getting list of projects: %s", err);
         return next(err);
      }
      console.log(result);
      var tempProjectList = [];
      result.forEach(function(obj) {
         tempProjectList.push(
             {
                title    : obj.title,
                tasks    : obj.tasks.length,
                completed: obj.completedTasks,
                timeSpent: obj.timeSpent,
                members  : obj.members.length,
                lastMod  : obj.lastMod.shortDate()
             }
         );
      });
      console.log("___________________________\nResult project list for render: \n___________________________")
      console.log(tempProjectList);
      res.render('projects.jade', {user: req.session.user_id, projects: tempProjectList});
   });
});

module.exports = projectsRoutes;