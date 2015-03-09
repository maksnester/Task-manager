'use strict';

var email;

$(document).ready(function() {
    email = document.querySelector("#email");
});

/**
 * Проверяет установленный в форме email при помощи ajax запроса
 * Можно добавить дополнительные проверки
 */
function validateForm() {
    var validationPassed = false;
    $.ajax({
        async: false,
        url: "/checkEmail",
        data: {email: email.value},
        dataType: "json",
        method: "post",
        // exists - json field with boolean value
        success: function(response) {
            if (response.exists) showErrorMessage("User with specified email already exists.");
            else validationPassed = true;
        }
    });

    return validationPassed;
}