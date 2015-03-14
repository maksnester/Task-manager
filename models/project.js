var mongoose = require('lib/mongoose');
var Schema = mongoose.Schema;
var Task = require('models/task').Task;


var schema = new Schema({
    title  : {
        type    : String,
        required: true
    },
    owner : {
        type    : Schema.Types.ObjectId,
        ref     : 'User',
        required: true
    },
    members: [{type: Schema.Types.ObjectId, ref: 'User'}],
    tasks  : [{type: Schema.Types.ObjectId, ref: 'Task'}],
    created: {
        type   : Date,
        default: new Date()
    },
    lastMod: {
        type: Date,
        default: new Date()
    }
});

schema.pre('save', function (next) {
    this.lastMod = new Date();
    next();
});

module.exports.Project = mongoose.model('Project', schema);

