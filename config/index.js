var fs    = require('fs'),
    path  = require('path'),
    nconf = require('nconf');

var single = new nconf.Provider({
    env: true,
    argv: true,
    store: {
        type: 'file',
        file: path.join(__dirname, 'config.json')
    }
});

nconf.use('file', { file: path.join(__dirname, 'config.json') });

module.exports = nconf;