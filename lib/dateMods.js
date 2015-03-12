/**
 * Converts the amount of minutes to string like 1w 3d 14h 15m
 * @param time - amount of minutes
 * @returns {string}
 */
var getTimeSpent = function (time) {
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
};

module.exports.getTimeSpent = getTimeSpent;

