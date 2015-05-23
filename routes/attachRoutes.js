// Usable for /projects/:project/:task/[new|:attachId]

var fs = require('fs');
var path = require('path');
var config = require('config');

var express = require('express');
var attachRoutes = express.Router();

var multiparty = require('multiparty');

var checkAuth = require('routes/authRoutes').checkAuth;
var checkRights = require('lib/permissions').checkRights;

var ObjectId = require('mongoose').Types.ObjectId; // fabric
var Task = require('models/task').Task;

var basePath = config.get('storage:path');


attachRoutes.get('/projects/:project/:task/attachments/:attachName', checkAuth, getOneAttachment);

attachRoutes.delete('/projects/:project/:task/attachments/:attachName', checkAuth, deleteAttachment);

attachRoutes.post('/projects/:project/:task/attachments/new', checkAuth, attachFile);

/**
 * Sends requested attach
 * @param req
 * @param res
 * @param next
 */
function getOneAttachment(req, res, next) {
    var userId = req.session.user_id;
    var projectId = req.params.project;
    var taskId = req.params.task;
    var attachName = req.params.attachName;

    checkRights(projectId, userId, 'read', 'task', function (err) {
        if (err) return res.status(403).json({error: err.message || err});

        Task.findById(taskId, "attachments", function (err) {
            if (err) return next(err);
            var filePath = path.resolve(basePath, userId, projectId, taskId, 'attachments', attachName);
            try {
                fs.statSync(filePath);
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    console.error('File not found in path: ' + filePath);
                    return res.status(404).json({error: 'File not found'});
                }
                return next(err);
            }
            res.sendFile(filePath);
        });
    });
}


/**
 * Removes attachment by name from db and fs with right check.
 * @param req
 * @param res
 * @param next
 */
function deleteAttachment(req, res, next) {
    var userId = req.session.user_id;
    var projectId = req.params.project;
    var taskId = req.params.task;
    var attachName = req.params.attachName;

    var resource = 'taskAttachment';
    Task.findById(taskId, "attachments", function (err, task) {
        if (err) return next(err);

        // find attach id by name
        var attachIndex = -1;
        var attachId;
        for (var i = 0; i < task.attachments.length; i++) {
            if (task.attachments[i].filename === attachName) {
                attachIndex = i;
                attachId = task.attachments[i]._id;
                break;
            }
        }

        if (attachIndex === -1) return res.send(404).json({error: 'Attachment not found.'});

        // if attach.owner === current user than change resource name on 'myTaskAttachment'
        if (task.attachments[attachIndex].owner.equals(userId)) {
            resource = 'myTaskAttachment';
        }

        checkRights(projectId, userId, 'delete', resource, function (err) {
            if (err) return res.status(403).json({error: err.message || err});

            // remove attachment from fs and db
            task.attachments.id(attachId).remove();

            task.save(function(err) {
                if (err) return next(err);

                var filePath = path.resolve(basePath, userId, projectId, taskId, 'attachments', attachName);
                fs.unlink(filePath, function (err) {
                    // these errors unhandled because db already updated
                    if (err) console.error(err);
                    res.sendStatus(200);
                });
            });
        });
    });
}

/**
 * Create a new attachment for task.
 * @param req
 * @param res
 * @param next
 */
function attachFile(req, res, next) {
    var userId = req.session.user_id;
    var projectId = req.params.project;
    var taskId = req.params.task;

    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        if (err) return next(err);
        if (!files || !files.file.length) return next(new Error('Can not read attached file.'));

        //TODO obviously we needs to be able to create multiple attachments at once
        var file = files.file[0];

        if (file.path) {
            checkRights(projectId, userId, 'create', 'taskAttachment', function (err) {
                if (err) return res.status(403).json({error: err.message || err});
                var tmp_path = file.path;

                // storage -> user -> project -> task -> attachments -> ...
                var userPath = path.join(basePath, userId);
                var projectPath = path.join(userPath, projectId);
                var taskPath = path.join(projectPath, taskId);
                var attachmentsPath = path.join(taskPath, 'attachments');

                // happy mkdir... happy mkdir!
                try {
                    try {
                        fs.statSync(attachmentsPath);
                    }
                    catch (err) {
                        try {
                            fs.statSync(taskPath); // task folder exists
                        }
                        catch (err) {
                            try {
                                fs.statSync(projectPath); // project folder exists
                            }
                            catch (err) {
                                try {
                                    fs.statSync(userPath); // user folder exists
                                }
                                catch (err) {
                                    fs.mkdirSync(userPath);
                                }
                                fs.mkdirSync(projectPath);
                            }
                            fs.mkdirSync(taskPath);
                        }
                        fs.mkdirSync(attachmentsPath);
                    }
                }
                catch (err) {
                    return next(err);
                }

                // now we have a folder like storage/userId/projectId/taskId/, will store file here
                // create an attachment object
                Task.findById(taskId, "attachments", function (err, task) {
                    if (err) return next(err);

                    var filename = file.originalFilename;
                    var webLink = path.join('projects', projectId, taskId, 'attachments', file.originalFilename).replace(/\\/g, '/');
                    task.attachments.push({
                        _id: ObjectId(),
                        owner: userId,
                        filename: filename,
                        link: webLink,
                        date: new Date()
                    });

                    var targetPath = path.join(attachmentsPath, filename);

                    fs.stat(targetPath, function (err, stat) {
                        if (stat) {
                            console.error('File attached already');
                            return res.status(400).json({error: 'File attached already'});
                        }
                        fs.rename(tmp_path, targetPath, function (err) {
                            if (err) {
                                return next(err);
                            }
                            task.save(function (err) {
                                if (err) {
                                    fs.unlink(targetPath, function (err) {
                                        if (err) {
                                            console.error("Error while unlink target path: ", err);
                                            return next(err);
                                        }
                                    });
                                    return next(err);
                                }
                                console.info('File uploaded to: ' + targetPath + ' - ' + file.size + ' bytes');
                                res.status(200).json({link: webLink, uploader: req.currentUser.name});
                            });
                        });
                    });
                });
            });
        }
        else {
            console.error('No files attached.');
            res.sendStatus(400);
        }
    });
}


module.exports = attachRoutes;