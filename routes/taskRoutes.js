'use strict';

var express = require('express');
var taskRoutes = express.Router();
var bodyParser = require('body-parser');
var checkAuth = require('routes/authRoutes').checkAuth;
var Project = require('models/project').Project;
var Task = require('models/task').Task;
var getTimeSpent = require('lib/dateMods').getTimeSpent;

var parseBody = bodyParser.urlencoded({extended: false});

//TODO check rights on all actions

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

        if (req.body.timeSpent) task.timeSpent += parseInt(req.body.timeSpent, 10);

        task.save(function (err, task) {
            if (err) {
                console.log("Erorr occured on task update: %s. Task id = %s", err, req.params.task);
                if (err.name === "ValidationError") return res.status(400).json({error: "ValidationError"});
                return next(err);
            }
            console.log("OK. Project id=%s, task id=%s", req.params.project, req.params.task);
            task._doc.timeSpent = getTimeSpent(task.timeSpent);
            res.status(200).json(task);
        })
    })

}

/**
 * Find task by id and return requested field or entire task if field not found.
 * @param req
 * @param res
 * @param next
 */
function getTaskField (req, res, next) {
    Task.findById(req.params.task, function(err, task) {
        if (err) {
            console.error("Error occurred when try to find task with id=%s", req.params.task);
            return next(err);
        }
        if (!task) res.status(400).json({error: "task not found"});
        console.log("Found task: " + task);

        if (req.query.field) {
            var responseJson = {};
            responseJson[req.query.field] = task[req.query.field];
            res.json(responseJson);
        } else res.json(task);
    });
}

function deleteTask (req, res, next) {
    Task.findById(req.params.task).remove(function(err) {
        if (err) {
            console.error("Error occurred when delete task with id %s. Error: ", req.params.task, err);
            return next(err);
        }
        res.sendStatus(200);
    })
}

module.exports = taskRoutes;