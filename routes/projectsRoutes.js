'use strict';

var express = require('express');
var projectsRoutes = express.Router();
var bodyParser = require('body-parser');
var checkAuth = require('routes/authRoutes').checkAuth;
var Project = require('models/project').Project;
var Task = require('models/task').Task;
var getTimeSpent = require('lib/dateMods').getTimeSpent;

var parseBody = bodyParser.urlencoded({extended: false});

projectsRoutes.get('/projects', checkAuth, showProjectsList);

//TODO check rights on this action
//add new task into :id project
projectsRoutes.post('/projects/:id/new', parseBody, checkAuth, createTask);

//TODO checkAuth + check rights on current project. If not member or creator - fake 404
//go to project
projectsRoutes.get('/projects/:id', checkAuth, showProjectById);

//create a new project
projectsRoutes.post('/projects/new', parseBody, checkAuth, createProject);


function createProject(req, res, next) {
   var title = req.body.projectTitle || null;
   if (!title || title.trim().length === 0) {
      return res.status(400).json({error: "emptyTitle"});
   }
   var newProject = new Project({
      title: title,
      owner: req.session.user_id
   });
   newProject.save(function(err, newProject) {
      if (err) {
          console.error("Error while saving new project: %s", err);
          return next(err);
      }
      res.json({_id: newProject._id});
   })
}


/**
 * Send page with projects which are belong to current user
 * TODO show also these projects where user is a member
 * @param req
 * @param res
 * @param next
 */
function showProjectsList(req, res, next) {
    var query = Project
        .find({owner: req.session.user_id})
        .populate('_tasks')
        .sort({lastMod: -1});
    query.exec(function (err, result) {
        if (err) {
            console.log("Error when getting list of projects: %s", err);
            return next(err);
        }
        console.log(result);
        var tempProjectList = [];
        result.forEach(function (project) {

            var completedTasks = 0;
            var timeSpent = 0;
            project.tasks.forEach(function(task) {
                timeSpent += task.timeSpent || 0;
                if (task.isCompleted) completedTasks++;
            });

            tempProjectList.push(
                {
                    _id      : project._id,
                    title    : project.title,
                    tasks    : project.tasks.length,
                    completed: completedTasks,
                    timeSpent: getTimeSpent(timeSpent),
                    members  : project.members.length,
                    lastMod  : (project.lastMod) ? project.lastMod.shortDate()
                        : project.created.shortDate()
                }
            );
        });
        console.log("___________________________\nResult project list for render: \n___________________________");
        console.log(tempProjectList);
        res.render('projects.jade', {user: req.session.user_id, projects: tempProjectList});
    });
}

/**
 * request contains id of particular project. Response with full project info.
 * @param req
 * @param res
 * @param next
 */
function showProjectById(req, res, next) {
    Project.findById(req.params.id).populate('tasks').exec(function (err, result) {
            if (err) {
                console.log("Error while finding project with id=%s. Error: %s", req.param.id, err);
                return next(err);
            }
            if (!result) return next(); //404
            var tasks;
            if (result.tasks) {
                tasks = {
                    current : [],
                    finished: []
                };
                // split by two type of tasks and convert timeSpent from minutes to string
                result.tasks.forEach(function (task) {
                    task.timeSpent = getTimeSpent(task.timeSpent);
                    if (task.isCompleted) tasks.finished.push(task);
                    else tasks.current.push(task);
                });
                if (tasks.current.length === 0) tasks.current = null;
                if (tasks.finished.length === 0) tasks.finished = null;
            }

            var renderObjects = {
                user        : req.session.user_id,
                projectTitle: result.title,
                tasks       : tasks
            };
            res.render('current-project.jade', renderObjects);
        }
    );
}

/**
 * Creating a new task for project which id specified in req.params.id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function createTask(req, res, next) {
    var title = req.body.taskTitle || null;
    var description = req.body.description;
    var priority = req.body.priority;

    if (!title || title.trim().length === 0) {
        return res.status(400).json({error: "emptyTitle"});
    }

    var newTask = {
        title : title,
        author: req.session.user_id,
        parent: req.params.id
    };

    if (description && description.trim().length !== 0) {
        newTask.description = description;
    }

    if (priority && priority.trim().length !== 0) {
        newTask.priority = Number.parseInt(priority);
    }

    new Task(newTask).save(function (err, result) {
        if (err) {
            console.error("Error while saving new task: %s", err);
            return next(err);
        }
        var id = result._id;
        Project.update({"_id": req.params.id}, {"$push": {tasks: id}}, function (err) {
                if (err) {
                    console.log("Error while pushing new task into parent: %s", err);
                    return next(err);
                }
                res.sendStatus(200);
            }
        );
    })
}

module.exports = projectsRoutes;