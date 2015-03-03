var mongoose = require('mongoose');
var config = require('config');

mongoose.connect(config.get('mongoose:uri'));

mongoose.connection.on('connected', function() {
    console.log("Connected to db successfully");
});

mongoose.connection.on('error', function(err) {
    console.error(err);
});

//при ошибке подключения пытается переприсоединиться
//TODO: если база отключена при запуске, то страницы не отдаются

mongoose.connection.on('disconnected', function (err) {
    console.error("Lost connection to database");
    setTimeout(function () {
            mongoose.connect(config.get('mongoose:uri'))
        }, 2000
    )
});

module.exports = mongoose;