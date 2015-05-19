'use strict';

var async = require('async');

var express = require('express');
var taskRoutes = express.Router();
var bodyParser = require('body-parser');
var checkAuth = require('routes/authRoutes').checkAuth;
var parseBody = bodyParser.urlencoded({extended: false});

var Project = require('models/project').Project;
var Task = require('models/task').Task;
var User = require('models/user').User;
var TimeJournal = require('models/timeJournal').TimeJournal;

var getTimeSpent = require('lib/dateMods').getTimeSpent;

//TODO check rights on all actions

taskRoutes.get('/projects/:project/timeJournal', checkAuth, getTimeJournal);
taskRoutes.get('/projects/:project/:task', checkAuth, getTaskField);

taskRoutes.post('/projects/:id/new', parseBody, checkAuth, createTask);

taskRoutes.put('/projects/:project/:task', parseBody, checkAuth, editTask);

taskRoutes.delete('/projects/:project/:task', checkAuth, deleteTask);

/**
 * Creating a new task for project which id specified in req.params.id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function createTask(req, res, next) {
    var title = req.body.taskTitle || null;
    var description = req.body.taskDescription;
    var priority = req.body.taskPriority;

    if (!title || title.trim().length === 0) {
        return res.status(400).json({error: "emptyTitle"});
    }

    var newTask = {
        title: title,
        author: req.session.user_id,
        parent: req.params.id
    };

    if (description && description.trim().length !== 0) {
        newTask.description = description;
    }

    if (priority && priority.trim().length !== 0) {
        newTask.priority = parseInt(priority, 10);
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
    });
}

function editTask(req, res, next) {
    Task.findById(req.params.task, function (err, task) {
        if (err) {
            console.log("Erorr occured on task finding: %s. Task id = %s", err, req.params.task);
            return next(err);
        }

        if (req.body.title) task.title = req.body.title;
        if (req.body.description) task.description = req.body.description;
        if (req.body.priority) task.priority = parseInt(req.body.priority, 10);
        if (req.body.isCompleted) task.isCompleted = req.body.isCompleted;

        var readyToSave = Promise.resolve(task);
        var timeJournalUpdated = Promise.resolve();

        if (req.body.timeSpent) {
            var addedTime = parseInt(req.body.timeSpent, 10);
            task.timeSpent += addedTime;

            var journalEntry = new TimeJournal({
                task: task._id,
                user: req.currentUser,
                date: new Date(),
                timeSpent: addedTime
            });

            // add record to journal
            timeJournalUpdated = timeJournalUpdated.then(journalEntry.save());
        }

        if (req.body.assigned) {
            readyToSave = readyToSave
                .then(function (task) {
                    var userFound = User.findOne({email: req.body.assigned}, "_id").exec(); // get user
                    return userFound.then(function (user) {
                        if (!user) throw new Error("user not found with email = " + req.body.assigned);
                        task.assigned = user._id;
                        return task;
                    });
                });
        }

        Promise.all([readyToSave, timeJournalUpdated]).then(function (results) {
            var task = results[0];
            task.save(function (err, task) {
                console.log("OK. Saved: Project id=%s, task id=%s", req.params.project, req.params.task);

                task._doc.timeSpent = getTimeSpent(task.timeSpent); // ugly
                res.status(200).json(task);
            });
        }, function (err) {

            console.log("Error occurred on task update: %s. Task id = %s", err, req.params.task);
            if (err.name === "ValidationError") {
                return res.status(400).json({error: "ValidationError"});
            }

            next(err);
        });
    })
}

/**
 * Find task by id and return requested field or entire task if field not found.
 * @param req
 * @param res
 * @param next
 */
function getTaskField(req, res, next) {
    Task.findById(req.params.task).populate({path: 'author assigned', select: "name email"}).exec(function (err, task) {
        if (err) {
            console.error("Error occurred when try to find task with id=%s", req.params.task);
            return next(err);
        }
        if (!task) res.status(400).json({error: "task not found"});
        console.log("Found task: " + task);

        if (!req.query.field || req.query.field === 'assigned') {
            getAssignedField(task, function (err, assigned) {
                if (err) res.status(500).json({error: err});
                if (req.query.field) {
                    // need only assigned field
                    res.json(assigned);
                } else {
                    // need whole task
                    task._doc.assigned = assigned; // replace ref for correct object with info about members
                    res.json(task);
                }
            });
        } else {
            var responseJson = {};
            responseJson[req.query.field] = task[req.query.field];
            res.json(responseJson);
        }
    });

    /**
     * Send to callback an object like {assigned: name+email, members: [...]}
     * @param task
     * @param callback
     */
    function getAssignedField(task, callback) {
        var result = {members: []};
        if (task.assigned) {
            result.assigned = task.assigned.name + ' (' + task.assigned.email + ')';
        } else {
            result.assigned = task.author.name + ' (' + task.author.email + ')';
        }
        // get other members
        var q = Project.findById(task.parent, "members").populate("members.user");
        q.exec(function (err, project) {
            if (err) {
                console.error("getAssignedField: Error - %j", err);
                return callback(err);
            } else if (!project) {
                console.error("getAssignedField: Project not found.");
                return callback("Project not found.");
            }

            var i = 0;
            var len = project.members.length;
            for (; i < len; i++) {
                result.members.push(project.members[i].user.name + ' (' + project.members[i].user.email + ')');
            }
            callback(null, result);
        });
    }
}

function deleteTask(req, res, next) {
    Task.findById(req.params.task).remove(function (err) {
        if (err) {
            console.error("Error occurred when delete task with id %s. Error: ", req.params.task, err);
            return next(err);
        }
        res.sendStatus(200);
    })
}

/**
 * Sends timeJournal for project. Needs for visualisation.
 * @param req
 * @param res
 * @param next
 */
function getTimeJournal(req, res, next) {
    Task.find({parent: req.params.project}, "_id").exec()
        .then(function (taskIds) {
            var ids = taskIds.map(function(doc) {return doc._id});
            return TimeJournal.find({'task': {$in: ids}}, "task user timeSpent date")
                .populate([
                    {path: 'task', select: 'title isCompleted timeSpent'},
                    {path: 'user', select: 'name email'}
                ])
                .exec();
        })
        .then(function (journalRecords) {
            var response = journalRecords.map(function(record) { delete record._doc._id; return record;});
            res.send(response);
        })
        .then(null, function(err) {
            console.error(err);
            return next(err);
        });
}

module.exports = taskRoutes;