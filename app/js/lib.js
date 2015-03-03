/**
 *
 * @param alertType строка вида alert-success, alert-warning, alert-danger или alert-info
 * @param message
 */
function getAlertTagAsString(alertType, message) {
    var word = alertType.split("-").pop(); // get part after "-"

    if (alertType === "alert-danger") word = "Error";
    else {
        word = word[0].toUpperCase() + word.slice(1, word.length);
    }

    return  '<div class="alert ' + alertType + '">' +
            '<a href="#" class="close" data-dismiss="alert">&times;</a>' +
            '<strong>' + word + '. </strong> ' + message +
            '</div>';
}

/**
 * Выводит на экран сообщение об ошибке
 * @param message
 */
function showErrorMessage(message) {
    $('body').prepend(getAlertTagAsString('alert-danger', message));
}