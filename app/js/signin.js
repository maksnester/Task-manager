window.onload = function () {
    // только что зарегистрировался - показать сообщение об успешной регистрации
    if (location.search.indexOf("newreg") > -1) {
        $('body').prepend(getAlertTagAsString('alert-success', 'Now you are able to signin.'))
    }
};
