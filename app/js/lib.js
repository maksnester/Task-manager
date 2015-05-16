/**
 *
 * @param alertType string means bs class like 'alert-success', 'alert-warning', 'alert-danger' or 'alert-info'
 * @param message
 */
function getAlertTagAsString(alertType, message) {
    var word = alertType.split("-").pop(); // get part after "-"

    if (alertType === "alert-danger") word = "Error";
    else {
        word = word[0].toUpperCase() + word.slice(1, word.length);
    }

    return '<div class="alert ' + alertType + '">' +
        '<a href="#" class="close" data-dismiss="alert">&times;</a>' +
        '<strong>' + word + '. </strong> ' + message +
        '</div>';
}

/**
 * @param message
 */
function showErrorMessage(message) {
    $('body').prepend(getAlertTagAsString('alert-danger', message));
}

/**
 * Converts the amount of minutes to string like 1w 3d 14h 15m
 * NB! 1d equals to 8h
 * @param time - amount of minutes
 * @returns {string}
 */
function getTimeSpent(time) {
    var weeks = Math.floor(time / 3360); // minutes per week
    var days = Math.floor((time % 3360) / 480); // minutes per day
    var hours = Math.floor(((time % 3360) % 480) / 60);
    var mins = Math.floor(((time % 3360) % 480) % 60);

    var result = (
    ((weeks > 0) ? weeks + "w" : "") +
    ((days > 0) ? " " + days + "d" : "") +
    ((hours > 0) ? " " + hours + "h" : "") +
    ((mins > 0) ? " " + mins + "m" : "")
    ).trim();

    return (result.length > 0) ? result : null;
}

/**
 * Converts string like '1w 3d 4h 10m' into minutes
 * NB! 1d equals to 8h
 * @param timeSpent
 * @returns {number}
 */
function getDeltaTime(timeSpent) {
    if (typeof timeSpent !== 'string') return null; // parse error
    timeSpent = timeSpent.trim();
    var result = 0;

    var units = {
        w: 60 * 8 * 7,
        d: 60 * 8,
        h: 60,
        m: 1
    };

    var regexpStr;
    var matches;
    for (var unit in units) {
        if (units.hasOwnProperty(unit)) {
            regexpStr = "[0-9]+" + unit;
            matches = timeSpent.match(new RegExp(regexpStr), 'ig');

            if (matches) {
                if (matches.length > 1) return null; // parse error
                // units.unit is time coefficient means how many minutes in unit
                result += Number.parseInt(matches[0].slice(0, -1), 10) * units[unit];
            }
        }
    }

    if (timeSpent[0] === "-") result *= (-1);
    return result;
}