'use strict';

var taskTitle,
    taskDescription,
    taskPriority,
    newProjectModal;

var currentUrl = (window.location.href + "/").replace(/\/*$/, "/");

$(document).ready(function() {
    $('.carousel').carousel({interval: 0});
    taskTitle = $('#taskTitle')[0];
    taskDescription = $('#taskDescription')[0];
    taskPriority = $('#taskPriority')[0];
    newProjectModal = $('#newProjectModal')[0];

    $(taskTitle).popover({
        html: true,
        content: '<i class="fa fa-exclamation-triangle" style="color: rgb(253, 133, 98)"></i>Title should not be empty.',
        placement: 'bottom',
        trigger: 'manual'
    });
    taskTitle.onclick = function() {
        $(taskTitle).popover('hide');
    }
});

function addTask() {
    $.ajax({
        async   : true,
        data    : {
            taskTitle      : taskTitle.value,
            taskDescription: taskDescription.value,
            taskPriority   : taskPriority.value
        },
        method  : "post",
        url     : currentUrl + "new",
        success : function (data, textStatus, jqXHR) {
            location.reload();
        },
        error: function(jqXHR, textStatus, errorThrown)  {
            if (typeof jqXHR.responseJSON != "undefined" &&
                typeof jqXHR.responseJSON.error != "undefined" &&
                jqXHR.responseJSON.error === "emptyTitle") {
                $(taskTitle).popover('show');
            }
        },
        complete: function (jqXHR, status) {
            console.info("Server response with " + status || "Ok");
        }
    });
}