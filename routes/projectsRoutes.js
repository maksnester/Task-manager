'use strict';

var express = require('express');
var projectsRoutes = express.Router();
var bodyParser = require('body-parser');
var checkAuth = require('routes/authRoutes').checkAuth;
var Project = require('models/project').Project;

projectsRoutes.get('/projects', checkAuth, showProjectsList);

projectsRoutes.get('/projects/:id', function (req, res) {
   Project.findById(req.params.id, function (err, result) {
          res.json(result);
          return result;
       }
   )
});

projectsRoutes.post('/projects/new',
    bodyParser.urlencoded({extended: false}),checkAuth, createProject);


function createProject(req, res, next) {
   var title = req.body.projectTitle || null;
   if (!title || title.trim().length === 0) {
      return res.json({error: "emptyTitle"});
   }
   var newProject = new Project({
      title: title,
      _owner: req.session.user_id
   });
   newProject.save(function(err, newProject) {
      if (err) return console.error("Error while saving new project: %s", err);
      res.json({_id: newProject._id});
   })
}


/**
 * Отдаёт страницу со списком проектов, которые принадлежат текущему пользователю
 * TODO show also these projects where user a member
 * @param req
 * @param res
 * @param next
 */
function showProjectsList(req, res, next) {
   var query = Project.find({_owner: req.session.user_id}).sort({lastMod: -1});
   query.exec(function (err, result) {
      if (err) {
         console.log("Error when getting list of projects: %s", err);
         return next(err);
      }
      console.log(result);
      var tempProjectList = [];
      result.forEach(function (obj) {
         tempProjectList.push(
             {
                _id      : obj._id,
                title    : obj.title,
                tasks    : obj.tasks.length,
                completed: obj.completedTasks,
                timeSpent: obj.timeSpent,
                members  : obj.members.length,
                lastMod  : (obj.lastMod) ? obj.lastMod.shortDate() : obj.created.shortDate()
             }
         );
      });
      console.log("___________________________\nResult project list for render: \n___________________________");
      console.log(tempProjectList);
      res.render('projects.jade', {user: req.session.user_id, projects: tempProjectList});
   });
}

module.exports = projectsRoutes;