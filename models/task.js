var mongoose = require('lib/mongoose');
var Schema = mongoose.Schema;


var schema = new Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String
    },
    //считается время в минутах
    timeSpent: {
        type: Number, min: 0, max: Math.pow(2, 32) - 1,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number, min: 1, max: 5,
        default: 3
    },
    created: {
        type: Date,
        default: new Date()
    },
    lastMod: {
        type: Date,
        default: new Date()
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    assigned: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: this.author
    }
    //TODO add comments
    //TODO add attachments
    //TODO add tags
});

//TODO update parent's lastMod too
schema.pre('save', function (next) {
    this.lastMod = new Date();
    next();
});

module.exports.Task = mongoose.model('Task', schema);
