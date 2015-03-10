var mongoose = require('lib/mongoose');
var lastMod = require('lib/lastMod');
var Schema = mongoose.Schema;
var taskSchema = require('models/task').schema;

var schema = new Schema({
   title: {
       type: String,
       required: true
   },
    _owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{type: Schema.Types.ObjectId, ref: 'User'}],
    tasks: [taskSchema],
    created: {
        type: Date,
        default: Date.now()
    },
    lastMod: {
        type: Date
    }
});

schema.pre('save', function (next) {
    this.lastMod = new Date();
    next();
});


schema.virtual("timeSpent")
    .get(function () {
        var timeSpent = 0;
        this.tasks.forEach(function(task){
            timeSpent += task.timeSpent || 0;
        });
        return getTimeSpent(timeSpent);
    });

schema.virtual("completedTasks")
    .get(function () {
        var countCompleted = 0;
        this.tasks.forEach(function(task){
            if (task.isCompleted) countCompleted++;
        });
        return countCompleted;
    });

module.exports.Project = mongoose.model('Project', schema);

function getTimeSpent (time) {
    var weeks = Math.floor(time / 10080); // minutes per week
    var days = Math.floor((time % 10080) / 1440); // minutes per day
    var hours = Math.floor(((time % 10080) % 1440) / 60);
    var mins = Math.floor(((time % 10080) % 1440) % 60);

    var result = (
    ((weeks > 0) ? weeks + "w" : "") +
    ((days > 0) ? " " + days + "d" : "") +
    ((hours > 0) ? " " + hours + "h" : "") +
    ((mins > 0) ? " " + mins + "m" : "")
    ).trim();

    return (result.length > 0) ? result : null;
}