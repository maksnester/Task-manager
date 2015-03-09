// lastMod.js
module.exports = exports = function lastModifiedPlugin (schema, options) {
    schema.add({ lastMod: {
        type: Date,
        default: Date.now()
    } });

    schema.pre('save', function (next) {
        this.lastMod = new Date();
        next();
    });

    if (options && options.index) {
        schema.path('lastMod').index(options.index)
    }
};