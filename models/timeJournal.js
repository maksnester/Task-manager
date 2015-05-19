var mongoose = require('lib/mongoose');
var Schema = mongoose.Schema;


var schema = new Schema({
    //which task
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    // who tracked
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // when
    date: {
        type: Date,
        default: new Date()
    },
    // time in minutes
    timeSpent: {
        type: Number, min: 0, max: Math.pow(2, 32) - 1,
        default: 0
    }
});

module.exports.TimeJournal = mongoose.model('TimeJournal', schema);
