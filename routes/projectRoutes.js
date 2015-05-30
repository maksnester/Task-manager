'use strict';

var express = require('express');
var projectsRoutes = express.Router();
var taskRoutes = require('routes/taskRoutes');
var checkAuth = require('routes/authRoutes').checkAuth;

var Project = require('models/project').Project;
var Task = require('models/task').Task;
var User = require('models/user').User;
var TimeJournal = require('models/timeJournal').TimeJournal;


var bodyParser = require('body-parser');
var parseBody = bodyParser.urlencoded({extended: false});

var getTimeSpent = require('lib/dateMods').getTimeSpent;
var checkRights = require('lib/permissions').checkRights;


projectsRoutes.get('/projects', checkAuth, showProjectsList);
projectsRoutes.get('/projects/:id/members', checkAuth, getMembers);
projectsRoutes.get('/projects/:id', checkAuth, showProjectById);

projectsRoutes.post('/projects/new', parseBody, checkAuth, createProject);

projectsRoutes.put('/projects/:id/members/new', parseBody, checkAuth, addMember);

projectsRoutes.delete('/projects/:id/members/:email', checkAuth, removeMember);

projectsRoutes.use('/', taskRoutes);

function removeMember(req, res, next) {
    checkRights(req.params.id, req.currentUser._id, 'delete', 'member', function (err) {
        if (err) return res.status(403).json({error: err.message || err});
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
                removedMember,
                len = project.members.length,
                i = 0;
            for (; i < len; i++) {
                if (project.members[i].user.email === email) {
                    memberId = project.members[i]._id;
                    removedMember = project.members[i];
                    break;
                }
            }

            if (!memberId) return res.status(404).json({error: "User with this email was not found among the project members."});
            // no one can remove owner
            if (removedMember.user._id.equals(project.owner)) {
                var error = "Project owner can not be deleted.";
                console.error(error);
                return res.status(400).json({error: error})
            }
            project.members.id(memberId).remove();
            project.save(function (err) {
                if (err) return next(err);
                res.sendStatus(200);
            });
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

        // TODO perhaps its more convenient to set presave for time journal which will filling the field inside member
        var members = project.members;

        var userIds = members.map(function (m) {
            return m.user._id;
        });

        var taskIds = project.tasks.map(function (t) {
            return t;
        });

        var rules = [
            {'user': {$in: userIds}},
            {'task': {$in: taskIds}}
        ];

        // get timeSpent for each member
        TimeJournal.aggregate({$match: {$and: rules}})
            .group({
                _id: '$user',
                ts: {$sum: '$timeSpent'}
            })
            .exec(function (err, result) {
                if (err) {
                    console.error('Error while getting timeSpent for each users: ', err);
                } else {
                    var i, len = members.length;
                    result.forEach(function (elem) {
                        // elem is aggregation result like: _id: <userId>, timeSpent: <total timeSpent>
                        for (i = 0; i < len; i++) {
                            if (members[i].user._id.equals(elem._id)) {
                                members[i]._doc.timeSpent = elem.ts;
                                break;
                            }
                        }
                    });
                }
                res.send(members);
            });
    });
}

function addMember(req, res, next) {
    checkRights(req.params.id, req.currentUser._id, 'create', 'member', function (err) {
        if (err) return res.status(403).json({error: err.message || err});
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
 * @param req
 * @param res
 * @param next
 */
function showProjectsList(req, res, next) {
    var userId = req.session.user_id;
    var query = Project
        .find({$or: [{'owner': userId}, {'members.user': userId}]})
        .populate('tasks')
        .sort({lastMod: -1});
    query.exec(function (err, result) {
        if (err) {
            console.log("Error when getting list of projects: %s", err);
            return next(err);
        }
        //console.log(result);
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
        //console.log("___________________________\nResult project list for render: \n___________________________");
        //console.log(tempProjectList);
        res.append('Cache-control', 'no-store').render('projects.jade', {
            user: req.currentUser,
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
    checkRights(req.params.id, req.currentUser._id, 'read', 'project', function (err) {
        if (err) return res.status(403).json({error: err.message || err});
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
                    user: req.currentUser,
                    projectTitle: result.title,
                    tasks: tasks
                };
                //console.log("For project=%s taks list is:", req.params.id);
                //console.log(renderObjects);
                res.render('current-project.jade', renderObjects);
            }
        );
    });
}

module.exports = projectsRoutes;