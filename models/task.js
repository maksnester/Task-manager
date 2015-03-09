var mongoose = require('lib/mongoose');
var lastMod = require('lib/lastMod');
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
        type: Number, min: 0, max: Math.pow(2,32) - 1,
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
        default: Date.now()
    },
    lastMod: {
        type: Date,
        default: Date.now()
    }
});

schema.pre('save', function (next) {
    this.lastMod = new Date();
    next();
});

exports.shema = schema;
