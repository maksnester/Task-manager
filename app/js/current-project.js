'use strict';

var taskTitle,
    taskDescription,
    taskPriority,
    currentTasksContainer,
    finishedTasksContainer,
    newTaskModal,
    timeSpentModal,
    timeSpentInput,
    timeSpentModalSubmit,
    editTaskModal,
    editTaskTitle,
    editTaskDescription,
    editTaskPriority,
    editTaskDeleteBtn;

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
    timeSpentModal.submit(addTimeSpent);

    editTaskModal = $('#editTaskModal');
    editTaskTitle = $('#editTaskTitle');
    editTaskDescription = $('#editTaskDescription');
    editTaskPriority = $('#editTaskPriority');
    editTaskDeleteBtn = $('#editTaskDeleteBtn');

    var titlePopover = {
        html: true,
        title: "Empty title",
        content: '<i class="fa fa-exclamation-triangle"></i><b>Error.</b> Title should not be empty.',
        placement: 'bottom',
        trigger: 'manual'
    };

    $(taskTitle).popover(titlePopover);
    taskTitle.onclick = function () {
        $(taskTitle).popover('hide');
    };

    $('.create-task').click(function () {
        newTaskModal.modal('toggle');
        return false;
    });

    timeSpentInput.popover({
        html: true,
        content: '<i class="fa fa-exclamation-triangle"></i>' +
        '<b>Error.</b> Please check than you not trying to remove more time than already spent.',
        placement: 'bottom',
        trigger: 'manual'
    });

    $('#blank').popover({
        html: true,
        title: "Parse error",
        content: '<i class="fa fa-exclamation-triangle" style="color: rgb(253, 133, 98)"></i>' +
        '<b>Error.</b> Please check your syntax.',
        placement: 'bottom',
        trigger: 'manual'
    });

    timeSpentInput[0].onclick = function () {
        timeSpentInput.popover('hide');
        $('#blank').popover('hide');
    };

    editTaskTitle.popover(titlePopover);
    editTaskTitle[0].onclick = function() {
        editTaskTitle.popover('hide');
    }
});

function addTask() {
    if (!taskTitle.value || taskTitle.value.trim() === "") {
        $(taskTitle).popover('show');
        return;
    }

    $.ajax({
        async: true,
        data: {
            taskTitle: taskTitle.value,
            taskDescription: taskDescription.value,
            taskPriority: taskPriority.value
        },
        method: "post",
        url: currentUrl + "new",
        success: function (data, textStatus, jqXHR) {
            location.reload();
        },
        error: function (jqXHR, textStatus, errorThrown) {
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
        async: true,
        data: {
            isCompleted: isCompleted
        },
        method: "put",
        url: currentUrl + id,
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
        error: function (jqXHR, textStatus, errorThrown) {
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


function addTimeSpent(event) {
    event.preventDefault();
    var timeSpent = getDeltaTime(timeSpentInput[0].value);
    if (!timeSpent) {
        $('#blank').popover('show');
        return;
    }
    var id = task.dataset.ouid;
    //update on server
    $.ajax({
        async: true,
        url: currentUrl + id,
        method: "put",
        data: {
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
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Server responded with: " + textStatus);
            if (typeof jqXHR.responseJSON != "undefined"
                && typeof jqXHR.responseJSON.error != "undefined"
                && jqXHR.responseJSON.error === "ValidationError") {

                timeSpentInput.popover('show');
            }
        }
    });
}

function showTaskEditModal(titleCol) {
    task = titleCol.parentNode;
    var id = task.dataset.ouid;

    // fill edit modal
    editTaskPriority[0].value = task.children[0].innerText;
    editTaskTitle[0].value = task.children[1].innerText;
    getFieldById(id, "description").done(function(jqXHR) {
        editTaskDescription[0].value = jqXHR.description || null;
    });

    editTaskModal.modal('show');
}

function editTask() {
    if (!editTaskTitle[0].value || editTaskTitle[0].value.trim() === "") {
        editTaskTitle.popover('show');
        return;
    }

    var id = task.dataset.ouid;
    $.ajax({
        url: currentUrl + id,
        method: "put",
        data: {
            title: editTaskTitle[0].value,
            description: editTaskDescription[0].value,
            priority: editTaskPriority[0].value
        },
        success: function(jqXHR, status) {
            console.info("Server respond with: " + status + ". Task " + id + " is updated;");
            task.children[0].innerText = jqXHR.priority;
            task.children[1].innerText = jqXHR.title;
            editTaskModal.modal('hide');
        },
        error: function(jqXHR, status) {
            console.error("Server respond with: " + status);

            if (typeof jqXHR.responseJSON != "undefined" &&
                typeof jqXHR.responseJSON.error != "undefined" &&
                jqXHR.responseJSON.error === "emptyTitle") {
                $(taskTitle).popover('show');
            }
        }
    });
}

function deleteTask() {
    if (!confirm("Really delete this task?")) return;
    var id = task.dataset.ouid;
    $.ajax({
        url: currentUrl + id,
        method: "delete",
        success: function(jqXHR, status) {
            console.info("Server respond with: " + status + ". Task " + id + " is deleted;");
            task.remove();
            editTaskModal.modal('hide');
        },
        error: function(jqXHR, status) {
            console.error("Server respond with: " + status);
        }
    });
}

function getFieldById(id, field) {
    return $.ajax({
        url: currentUrl + id,
        method: "get",
        data: {
            field: field
        },
        error: function(jqXHR, status) {
            console.error("Error while getting " + field + " for task " + id + ". Server respond with: " + status || error);
        }
    });
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

var prevSort;
var order = 1; // 1 is primary order
/**
 * Used as onclick parameter in template
 * @param field - column selector like ".taskTitle-col"
 * @param tasks - one of this selectors "#current-tasks" or "#finished-tasks"
 */
function sortBy(field, tasks) {
    order = prevSort === field ? (-1)*order : 1;
    prevSort = field;

    var sortByString = function (a, b) {
        //if (!(isNaN(a.innerText) || isNaN(b.innerText))) return sortByNumber(a,b);
        return order * a.innerText.toLowerCase().localeCompare(b.innerText.toLowerCase());
    };

    var sortByNumber = function (a, b) {
        if (isNaN(a.innerText) || isNaN(b.innerText)) return sortByString(a,b);
        if (a.innerText === b.innerText) return 0;
        return order * (parseInt(a.innerText, 10) > parseInt(b.innerText, 10) ? 1 : -1);
    };

    var sortByTimeSpent = function (a, b) {
        if (a.innerText === 'none' && b.innerText === 'none') return 0;
        else if (a.innerText === 'none') return -1;
        else if (b.innerText === 'none') return 1;

        var ta = getDeltaTime(a.innerText), tb = getDeltaTime(b.innerText);
        if (ta === tb) return 0;
        return order * ((ta > tb) ? 1 : -1);
    };

    var sortFunction;
    switch(field) {
        case ".taskTitle-col" : sortFunction = sortByString; break;
        case ".priority-col" : sortFunction = sortByNumber; break;
        case ".timeSpent-col" : sortFunction = sortByTimeSpent; break;
    }

    var list = $(tasks);

    var headers = list.find(".task-list-header");

    var array = list.find("> li").find("> " + field).get();
    array.sort(sortFunction);
    for (var i = 0; i < array.length; i++) {
        list.append(array[i].parentNode);
    }

    list.prepend(headers[0]);

    var orderClass = (order === 1) ? 'desc' : 'asc';
    var sortIcon = '<i class="sort fa fa-sort-' + orderClass + '"></i>';

    var sort = headers.find(field).find('.sort');
    if (sort.length === 0) {
        if (headers.find('.sort').length > 0) headers.find('.sort').remove();
        headers.find(field).append(sortIcon);
    }
    else sort[0].className = sort[0].className.replace(/fa-sort-.*$/, "fa-sort-" + orderClass);
}