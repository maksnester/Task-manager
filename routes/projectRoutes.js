'use strict';

var express = require('express');
var projectsRoutes = express.Router();
var taskRoutes = require('routes/taskRoutes');
var checkAuth = require('routes/authRoutes').checkAuth;
var checkRights = require('routes/permissions').checkRights;

var Project = require('models/project').Project;
var Task = require('models/task').Task;
var User = require('models/user').User;


var bodyParser = require('body-parser');
var parseBody = bodyParser.urlencoded({extended: false});

var getTimeSpent = require('lib/dateMods').getTimeSpent;


//TODO checkAuth + check rights. If not member fake 404

projectsRoutes.get('/projects', checkAuth, showProjectsList);
projectsRoutes.get('/projects/:id/members', checkAuth, getMembers);
projectsRoutes.get('/projects/:id', checkAuth, showProjectById);

projectsRoutes.post('/projects/new', parseBody, checkAuth, createProject);

projectsRoutes.put('/projects/:id/members/new', parseBody, checkAuth, addMember);

projectsRoutes.delete('/projects/:id/members/:email', checkAuth, checkRights, removeMember);

projectsRoutes.use('/', taskRoutes);

function removeMember(req, res, next) {
    var email = (req.params.email || "").toLowerCase();
    var projectId = req.params.id;

    var query = Project
        .findById(projectId)
        .populate({path: "members.user", select: "email"});

    query.exec(function (err, project) {
        if (err) return next(err);
        if (!project) res.status(404).json({error: "Project not found"});

        // find user among the members
        var memberId,
            len = project.members.length,
            i = 0;
        for (; i < len; i++) {
            if (project.members[i].user.email === email) {
                memberId = project.members[i]._id;
                break;
            }
        }

        if (!memberId) return res.status(404).json({error: "User with this email was not found among the project members."});
        project.members.id(memberId).remove();
        project.save(function(err) {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });


}

function getMembers(req, res, next) {
    var projectId = req.params.id;
    var query = Project
        .findOne({_id: projectId})
        .populate({path: 'members.user', select: "avatar name email"});
    query.exec(function (err, project) {
        if (err) return next(err);
        if (!project) res.status(404).json({error: "Project not found"});
        res.send(project.members);
    });
}

function addMember(req, res, next) {
    var email = (req.body.email || "").toLowerCase();
    var role = (req.body.role || "").toLowerCase();

    if (!email || !role) {
        return res.status(400).json({error: "Email and role required"});
    }

    var query = Project
        .findOne({_id: req.params.id})
        .populate('members.user');
    query.exec(function (err, project) {
        if (err) return next(err);
        if (!project) res.status(404).json({error: "Project not found"});

        var i = project.members.length;
        while (i--) {
            if (project.members[i].user.email === email) {
                return res.status(400).json({error: "User is member already"});
            }
        }

        User.findOne({email: email}, {"avatar": 1, "name": 1, "email": 1}, function (err, user) {
            if (err) return next(err);
            if (!user) return res.status(404).json({error: "User not found"});
            if (project.owner === user._id) return res.status(400).json({error: "User is project owner"});

            project.members.push({user: user._id, role: role});
            project.save(function (err) {
                if (err) return next(err);
                else {
                    var responseObject = {
                        user: user,
                        role: role
                    };
                    res.send(responseObject);
                }
            });
        });
    });
}

function createProject(req, res, next) {
    var title = req.body.projectTitle || null;
    if (!title || title.trim().length === 0) {
        return res.status(400).json({error: "emptyTitle"});
    }
    var newProject = new Project({
        title: title,
        owner: req.session.user_id,
        members: [{user: req.session.user_id, role: "owner"}]
    });
    newProject.save(function (err, newProject) {
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
        .populate('tasks')
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
            project.tasks.forEach(function (task) {
                timeSpent += task.timeSpent || 0;
                if (task.isCompleted) completedTasks++;
            });

            tempProjectList.push(
                {
                    _id: project._id,
                    title: project.title,
                    tasks: project.tasks.length,
                    completed: completedTasks,
                    timeSpent: getTimeSpent(timeSpent),
                    members: project.members.length,
                    lastMod: (project.lastMod) ? project.lastMod.shortDate()
                        : project.created.shortDate()
                }
            );
        });
        console.log("___________________________\nResult project list for render: \n___________________________");
        console.log(tempProjectList);
        res.append('Cache-control', 'no-store').render('projects.jade', {
            user: req.session.user_id,
            projects: tempProjectList
        });
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
                    current: [],
                    finished: []
                };
                // split by two type of tasks and convert timeSpent from minutes to string
                result.tasks.forEach(function (task) {
                    task._doc.timeSpent = getTimeSpent(task.timeSpent);
                    if (task.isCompleted) tasks.finished.push(task);
                    else tasks.current.push(task);
                });
                if (tasks.current.length === 0) tasks.current = null;
                if (tasks.finished.length === 0) tasks.finished = null;
            }

            var renderObjects = {
                user: req.session.user_id,
                projectTitle: result.title,
                tasks: tasks
            };
            console.log("For project=%s taks list is:", req.params.id);
            console.log(renderObjects);
            res.render('current-project.jade', renderObjects);
        }
    );
}

module.exports = projectsRoutes;