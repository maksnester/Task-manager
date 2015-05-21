var nodemailer = require('nodemailer');
var config = require('config');

var Task = require('models/task').Task;

var senderEmail = config.get('nodemailer:user');
var baseUrl = config.get('host') + ':' + config.get('port');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: senderEmail,
        pass: config.get('nodemailer:pass')
    }
});

var sender = 'Free task manager <' + senderEmail + '>';

/**
 * TODO add support of email templates and autoconversion from html to plaintext
 * Sends an email for receiver
 * @param {array | string} email receiver address
 * @param {string} subject
 * @param {string} html
 */
var sendTo = function (email, subject, html) {

    var mailOptions = {
        from: sender,
        to: email,
        subject: subject,
        html: html
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
};

/**
 *
 * @param {string} email receiver address
 * @param {ObjectId} taskId which was assigned
 * @param {User} assigner who assigned task to notified
 */
var notifyAssigned = function (email, taskId, assigner) {
    var subject = 'You assigned a new task: '; // + taskTitle
    var mailBody = '';

    Task.findById(taskId).exec()
        .then(function (task) {
            if (!task) throw new Error('Task not found');
            subject += task.title;

            mailBody += '<h2>';
            mailBody += task.title;
            mailBody += '</h2>';

            var description = task.description;
            if (description) {
                mailBody += '<p>Task description: "';
                mailBody += task.description;
                mailBody += '"</p><br>';
            }

            mailBody += '<p>Task priority: ';
            switch (task.priority) {
                case 1: mailBody += 'lowest</p>'; break;
                case 2: mailBody += 'low</p>'; break;
                case 3: mailBody += 'common</p>'; break;
                case 4: mailBody += 'high</p>'; break;
                case 5: mailBody += 'highest</p>'; break;
            }

            if (assigner) {
                mailBody += '<p>Assigned by: <a href="mailto:';
                mailBody += assigner.email;
                mailBody += '">';
                mailBody += assigner.name;
                mailBody += '</a>';
                mailBody += '</p>';
            }

            var link = 'http://' + baseUrl + '/projects/' + task.parent.toString();
            mailBody += '<br><hr><a href="' + link + '">Go to project.</a>';
        })
        .then(function() {
            sendTo(email, subject, mailBody);
        })
        .then(null, function(err) {
            console.error(err);
        });
};

module.exports.sendTo = sendTo;
module.exports.notifyAssigned = notifyAssigned;