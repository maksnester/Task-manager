'use strict';

var taskTitle,
    taskDescription,
    taskPriority,
    currentTasksContainer,
    finishedTasksContainer,
    newTaskModal,
    timeSpentModal,
    timeSpentInput,
    timeSpentModalSubmit;

var noTasks = document.createElement('div');
noTasks.className = "no-tasks";
noTasks.style.display = "none";

var currentUrl = (location.origin + location.pathname + "/").replace(/\/*$/, "/");

$(document).ready(function () {
    taskTitle = $('#taskTitle')[0];
    taskDescription = $('#taskDescription')[0];
    taskPriority = $('#taskPriority')[0];
    currentTasksContainer = $('#current-tasks');
    finishedTasksContainer = $('#finished-tasks');
    newTaskModal = $('#newTaskModal');
    timeSpentModal = $('#timeSpentModal');
    timeSpentInput = $('#timeSpentInput');
    timeSpentModalSubmit = $('#timeSpentModalSubmit');

    $(taskTitle).popover({
        html     : true,
        title    : "Empty title",
        content  : '<i class="fa fa-exclamation-triangle"></i><b>Error.</b> Title should not be empty.',
        placement: 'bottom',
        trigger  : 'manual'
    });
    taskTitle.onclick = function () {
        $(taskTitle).popover('hide');
    };

    $('.create-task').click(function () {
        newTaskModal.modal('toggle');
        return false;
    });

    timeSpentInput.popover({
        html     : true,
        content  : '<i class="fa fa-exclamation-triangle"></i>' +
        '<b>Error.</b> Please check than you not trying to remove more time than already spent.',
        placement: 'bottom',
        trigger  : 'manual'
    });

    $('#blank').popover({
        html     : true,
        title    : "Parse error",
        content  : '<i class="fa fa-exclamation-triangle" style="color: rgb(253, 133, 98)"></i>' +
        '<b>Error.</b> Please check your syntax.',
        placement: 'bottom',
        trigger  : 'manual'
    });

    timeSpentInput[0].onclick = function () {
        timeSpentInput.popover('hide');
        $('#blank').popover('hide');
    };
});

function addTask() {
    if (!taskTitle.value || taskTitle.value.trim() === "") {
        $(taskTitle).popover('show');
        return;
    }

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
        error   : function (jqXHR, textStatus, errorThrown) {
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

function setTaskCompleted(element, isCompleted) {
    var parent = $(element.parentNode.parentNode);
    var id = parent[0].dataset.ouid;
    var source = (isCompleted) ? currentTasksContainer : finishedTasksContainer;
    var destination = (isCompleted) ? finishedTasksContainer : currentTasksContainer;

    $.ajax({
        async  : true,
        data   : {
            isCompleted: isCompleted
        },
        method : "put",
        url    : currentUrl + id,
        success: function (jqXHR, status) {
            if (status) console.info("Success, status: " + status);

            element.className = (isCompleted)
                ? element.className.replace('fa-check', 'fa-undo')
                : element.className.replace('fa-undo', 'fa-check');

            element.onclick = function () {
                setTaskCompleted(element, !isCompleted);
            };
            var noTasksBlock = destination.find('.no-tasks');

            parent.hide(400).promise().done(function () {
                if (noTasksBlock[0]) noTasksBlock[0].remove();
                parent.remove();
                parent.appendTo(destination).show(400);
                if (source[0].childElementCount < 2) {
                    if (isCompleted) {
                        noTasks.textContent = 'No active tasks.';
                    } else {
                        noTasks.textContent = 'No tasks finished yet.';
                    }
                    $(noTasks).appendTo(source).show(400);
                }
            });
        },
        error  : function (jqXHR, textStatus, errorThrown) {
            console.error("Server responded with: " + textStatus);
        }
    });
}

//dom element which called modal window for adding timeSpent
var task = null;

function showTimeSpentModal(timeSpentCol) {
    timeSpentModal.modal('show');
    task = timeSpentCol.parentNode;
}

/**
 * This time will be added to current timeSpent for task
 * @param task - dom element with task string
 */
function addTimeSpent() {
    var timeSpent = getDeltaTime(timeSpentInput[0].value);
    if (!timeSpent) {
        $('#blank').popover('show');
        return;
    }
    var id = task.dataset.ouid;
    //update on server
    $.ajax({
        async  : true,
        url    : currentUrl + id,
        method : "put",
        data   : {
            timeSpent: timeSpent
        },
        success: function (jqXHR, status) {
            if (typeof jqXHR.timeSpent != "undefined") {
                // new timeStamp
                $(task).find('.timeSpent-col')[0].innerHTML = jqXHR.timeSpent ? jqXHR.timeSpent : 'none';
            } else {
                console.warn("New timeSpent wasn't received.")
            }

            if (status) console.info("Success, status: " + status);
            timeSpentModal.modal('hide');
        },
        error  : function (jqXHR, textStatus, errorThrown) {
            console.error("Server responded with: " + textStatus);
            if (typeof jqXHR.responseJSON != "undefined"
                && typeof jqXHR.responseJSON.error != "undefined"
                && jqXHR.responseJSON.error === "ValidationError") {

                timeSpentInput.popover('show');
            }
        }
    });

    //new time spent will be gotten from server
    //update view
}

/**
 * Переводит строку вида 1w 3d 4h 10m в количество минут
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