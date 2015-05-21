//TODO All this is very inflexible... Should be refactored

var Project = require('models/project').Project;

var resources = {
    'project': 0,
    'projectTitle': 1,
    'member': 2,
    'membersRole': 3,
    'task': 4,
    'taskTitle': 5,
    'taskDescription': 6,
    'taskPriority': 7,
    'taskAssigned': 8,
    'taskComment': 9,
    'taskAttachment': 10,
    'taskTimeSpent': 11,
    'taskIsCompleted': 12,
    'myTaskComment': 13,
    'myTaskAttachment': 14
};

var resourceExists = function (resValue) {
    for (var res in resources) {
        if (resources.hasOwnProperty(res)) {
            if (resources[res] === resValue) {
                return true;
            }
        }
    }

    return false;
};

var accessLevels = {
    'n/a': 0,
    'authenticated': 1,
    'read-only': 2,
    'executor': 3,
    'editor': 4,
    'owner': 5
};

var actions = {
    'read': 0,
    'create': 1,
    'update': 2,
    'delete': 3
};

/**
 *
 * Rows indexes equals to actions
 * Columns indexes equals to resources
 * Cell's values equals to accessLevels
 */
var accessRules = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [1, 0, 4, 0, 4, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3],
    [4, 4, 0, 4, 0, 4, 4, 4, 4, 4, 0, 3, 3, 3, 0],
    [5, 0, 4, 0, 4, 0, 0, 0, 0, 4, 4, 0, 0, 3, 3]
];


/**
 * @param {ObjectId} projectId
 * @param {ObjectId} userId
 * @param {string} action ('read', 'update', 'create', 'full')
 * @param {Array} reqResources from resources variable
 * @param callback
 */
function checkRights(projectId, userId, action, reqResources, callback) {
    // TODO add some value checks here
    var error;
    if (!projectId || !userId) {
        error = new Error('checkRights: incorrect params');
        console.error(error);
        throw error;
    }
    action = actions[action];

    var resourceIndexes;
    try {
        // if not an array then cast to it
        if (typeof(reqResources) === 'string' || typeof(reqResources) === 'number') {
            reqResources = [reqResources];
        }

        resourceIndexes = reqResources.map(function (resource) {
            if (typeof(resources[resource]) === 'number') {
                return resources[resource];
            } else if (resourceExists(resource)) {
                return resource;
            } else {
                var error = new Error('Requested resource not found');
                console.error(error);
                throw error;
            }
        });
    } catch (err) {
        console.error(err);
        return callback(err);
    }

    var userAccessLevel = accessLevels.authenticated; // default

    Project.findById(projectId, "owner members", function (err, project) {
        if (err) {
            console.error(err);
            return callback(err);
        }
        if (!project) {
            error = new Error('Project with id ' + projectId + ' not found.');
            console.error(error);
            return callback(error);
        }

        // highest access level
        if (project.owner.equals(userId)) {
            userAccessLevel = accessLevels.owner;
        } else {
            // check whether the user is a member and have a role
            var i = 0, len = project.members.length;
            for (; i < len; i++) {
                if (project.members[i].user.equals(userId)) {
                    userAccessLevel = accessLevels[project.members[i].role];
                    break;
                }
            }
        }

        // TODO if project is open for everyone on reading set userAccessLevel = accessLevels.readOnly
        // ... check if public
        // userAccessLevel = accessLevels.readOnly;

        // now check if user has enough rights for requested resource
        // by comparing accessLevel for desired action with actual userAccessLevel

        try {
            var requiredAccessLevels = resourceIndexes.map(function (resource) {
                if (!accessRules[action][resource]) throw new Error('Requested resource with access level n/a.');
                return accessRules[action][resource];
            });
        } catch (err) {
            console.error(err);
            return callback(err);
        }


        var enoughRights = function (accessLevel) {
            return userAccessLevel >= accessLevel;
        };

        if (requiredAccessLevels.every(enoughRights)) {
            callback(null); // ok
        } else {
            error = new Error('Not enough rights.');
            console.error(error);
            return callback(error);
        }

    });
}

module.exports.resources = resources;
module.exports.checkRights = checkRights;