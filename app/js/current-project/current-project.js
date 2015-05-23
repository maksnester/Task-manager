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
    editTaskAssigned,
    taskAttachments,
    hiddenAttach,
    attachForm,
    editTaskDeleteBtn,
    editTaskAttachBtn;

var noTasks = document.createElement('div');
noTasks.className = "no-tasks";
noTasks.style.display = "none";

//var currentUrl = (location.origin + location.pathname + "/").replace(/\/*$/, "/");
var currentUrl = (window.location.href).replace(/[\/#]*$/, "/");

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
    editTaskAssigned = $('#editTaskAssigned');
    editTaskDeleteBtn = $('#editTaskDeleteBtn');

    editTaskAttachBtn = $('#editTaskAttachBtn');
    taskAttachments = $('tbody', '#taskAttachments');

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
    editTaskTitle[0].onclick = function () {
        editTaskTitle.popover('hide');
    };

    hiddenAttach = $('#hiddenAttach');
    editTaskAttachBtn.on('click', function () {
        hiddenAttach.click();
    });

    attachForm = $('#attachForm');

    hiddenAttach.change(function () {
        if (!this.files.length) return;
        addNewAttach.call(this);
    });

    //attach remove btn
    taskAttachments.on("click", function (event) {
        if (event.target.className === 'close' && event.target.tagName === "BUTTON") {
            var tr = event.target.parentNode.parentNode;
            removeAttachment(tr);
        }
    });

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
        error: function (err) {
            if (typeof err.responseJSON !== "undefined" &&
                typeof err.responseJSON.error !== "undefined" &&
                err.responseJSON.error === "emptyTitle") {
                $(taskTitle).popover('show');
            } else {
                console.error(err);
            }
        }
    });
}

/**
 * Relocate task to another list and send put-request to the server.
 * @param element close|open button inside affected task
 * @param {boolean} isCompleted
 */
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

/**
 * Just check if task inside list of currentTasks or finished.
 * @param taskId
 */
function isTaskCompleted(taskId) {
    return ($('[data-ouid=' + taskId + ']', finishedTasksContainer).length) ? true : false;
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

var oldValues = {}; // values before edit

/**
 * Send a request to fill edit modal
 * @param titleCol
 */
function showTaskEditModal(titleCol) {
    if (titleCol) {
        task = titleCol.parentNode;
    }

    var id = task.dataset.ouid;

    // clean oldValues
    for (var prop in oldValues) {
        if (oldValues.hasOwnProperty(prop)) {
            delete oldValues[prop];
        }
    }

    // no field specified. Expected whole task with all fields.
    getFieldById(id).done(function (taskFromResponse) {
        oldValues.title = editTaskTitle[0].value = taskFromResponse.title;
        oldValues.description = editTaskDescription[0].value = taskFromResponse.description || '';
        oldValues.priority = editTaskPriority[0].value = taskFromResponse.priority;

        editTaskAssigned.empty();
        // assigned format: {assigned: name (email), members: [name (email),...]} and assigned duplicates inside members
        // convert it to options
        taskFromResponse.assigned.members.forEach(function (member, i) {
            var selected = "";
            if (member === taskFromResponse.assigned.assigned) {
                selected = 'selected';
                oldValues.assigned = i;
            }
            editTaskAssigned.append('<option ' + selected + ' value="' + i + '">' + member + '</option>');
        });

        hiddenAttach.val('');
        editTaskShowAttachments(taskFromResponse.attachments);

        // also reset priority, title, timeSpent in the tasks list. And check if task already completed.
        task.children[0].innerText = taskFromResponse.priority;
        task.children[1].innerText = taskFromResponse.title;
        task.children[2].innerText = getTimeSpent(taskFromResponse.timeSpent) || 'none';
        if (isTaskCompleted(id) !== taskFromResponse.isCompleted) {
            var btn,
                btnCol = $('.state-change-col', task);
            if (btnCol.length) {
                btn = btnCol[0].childNodes[0] || btnCol[0].firstChild;
                setTaskCompleted(btn, taskFromResponse.isCompleted);
            }
        }
    });

    editTaskModal.modal('show');
}

function editTask() {
    if (!editTaskTitle[0].value || editTaskTitle[0].value.trim() === "") {
        editTaskTitle.popover('show');
        return;
    }

    var id = task.dataset.ouid;

    var modifiedFields = getModifiedFields();

    // nothing was modified
    if (!Object.keys(modifiedFields).length) {
        editTaskModal.modal('hide');
        return;
    }

    $.ajax({
        url: currentUrl + id,
        method: "put",
        data: modifiedFields,
        success: function (jqXHR, status) {
            console.info("Server respond with: " + status + ". Task " + id + " is updated;");
            // update in list
            task.children[0].innerText = jqXHR.priority;
            task.children[1].innerText = jqXHR.title;
            editTaskModal.modal('hide');
        },
        error: function (jqXHR, status) {
            console.error("Server respond with: " + status);

            if (typeof jqXHR.responseJSON != "undefined" &&
                typeof jqXHR.responseJSON.error != "undefined" &&
                jqXHR.responseJSON.error === "emptyTitle") {
                $(taskTitle).popover('show');
            }
        }
    });

    function getAssigned() {
        var selected,
            len = editTaskAssigned[0].options.length,
            i = 0;
        for (; i < len; i++) {
            if (editTaskAssigned[0].options[i].selected) {
                selected = editTaskAssigned[0].options[i];
                break;
            }
        }
        var emailStart = selected.text.indexOf('(') + 1,
            emailEnd = selected.text.indexOf(')');

        return selected.text.slice(emailStart, emailEnd);
    }

    function getModifiedFields() {
        var modifiedFields = {};
        if (oldValues.title !== editTaskTitle[0].value) {
            modifiedFields.title = editTaskTitle[0].value;
        }
        if (oldValues.description !== editTaskDescription[0].value) {
            modifiedFields.description = editTaskDescription[0].value;
        }
        if (oldValues.priority !== parseInt(editTaskPriority[0].value, 10)) {
            modifiedFields.priority = editTaskPriority[0].value;
        }
        if (oldValues.assigned !== editTaskAssigned[0].selectedIndex) {
            modifiedFields.assigned = getAssigned();
        }
        return modifiedFields;
    }
}

function deleteTask() {
    if (!confirm("Really delete this task?")) return;
    var id = task.dataset.ouid;
    $.ajax({
        url: currentUrl + id,
        method: "delete",
        success: function (jqXHR, status) {
            console.info("Server respond with: " + status + ". Task " + id + " is deleted;");
            task.remove();
            editTaskModal.modal('hide');
        },
        error: function (jqXHR, status) {
            console.error("Server respond with: " + status);
        }
    });
}

/**
 *
 * @param taskId
 * @param [field] if not specified requests for all fields
 * @returns {Promise}
 */
function getFieldById(taskId, field) {
    return $.ajax({
        url: currentUrl + taskId,
        method: "get",
        data: {
            field: field
        },
        error: function (jqXHR, status) {
            console.error("Error while getting " + (field || 'all fields') + " for task " + taskId + ". Server respond with: " + status || error);
        }
    });
}

function addNewAttach() {
    var file = this.files[0];
    var tr = document.createElement('tr');
    tr.className = "new";

    var fileNameTd = document.createElement('td');
    fileNameTd.className = "filename";
    fileNameTd.innerHTML = file.name;

    var uploadTd = document.createElement('td');
    uploadTd.className = 'upload';
    uploadTd.colSpan = 2;

    var dots = '...';
    var timer = setInterval(function () {
        if (dots.length === 20) {
            dots = '...';
        } else {
            dots += '.';
        }
        uploadTd.innerHTML = dots;
    }, 1000);

    tr.appendChild(fileNameTd);
    tr.appendChild(uploadTd);

    if (taskAttachments.children().length) {
        taskAttachments.append(tr);
    } else {
        taskAttachments.html(tr);
    }


    var formData = new FormData(attachForm);
    formData.append('file', file);
    $.ajax({
        url: currentUrl + task.dataset.ouid + '/attachments/new',
        type: 'POST',
        data: formData,
        success: function (data) {
            console.info("File uploaded");
            fileNameTd.innerHTML = '<a href="' + window.location.origin + '/' + data.link + '">' + file.name + '</a>';

            uploadTd.className = "";
            uploadTd.colSpan = 1;
            uploadTd.innerHTML = moment().calendar();

            var uploaderTd = document.createElement('td');
            uploaderTd.innerHTML = data.uploader;
            var closeTd = document.createElement('td');
            closeTd.innerHTML = '<button type="button" aria-label="Close" class="close">×</button>';

            tr.appendChild(uploaderTd);
            tr.appendChild(closeTd);

            tr.className = "";
        },
        error: function (err) {
            console.error(err);
            $(tr).remove();
        },
        complete: function () {
            clearInterval(timer);
        },
        cache: false,
        processData: false,
        contentType: false
    });
}

function editTaskShowAttachments(attachments) {
    var html;
    if (!attachments || !attachments.length) {
        html = 'No attachments.'
    } else {
        html = '';
        //taskAttachments
        attachments.forEach(function (attach) {
            html += '<tr>';
            html += '<td><a href="'
            html += window.location.origin;
            html += '/';
            html += attach.link;
            html += '">';
            html += attach.filename;
            html += '</a></td><td>';

            html += moment(attach.date).calendar();
            html += '</td><td>';

            html += attach.owner.name;
            html += '</td><td><button type="button" aria-label="Close" class="close">×</button></td></tr>';
        });
    }

    taskAttachments.html(html);
}

/**
 *
 * @param attachTr dom element tr which contains attachment filename
 */
function removeAttachment(attachTr) {
    var a = attachTr.firstChild.firstChild;
    var filename = a.textContent || a.innerText;
    $.ajax({
        url: currentUrl + [task.dataset.ouid, 'attachments', filename].join('/'),
        method: 'delete',
        success: function () {
            console.info('file deleted');

            var parentNode = attachTr.parentNode;
            attachTr.remove();
            if (!parentNode.childNodes.length) {
                parentNode.innerHTML = 'No attachments';
            }
        },
        error: function (err) {
            console.error(err);
        }
    });
}


var prevSort;
var order = 1; // 1 is primary order
/**
 * Used as onclick parameter in template
 * @param field - column selector like ".taskTitle-col"
 * @param tasks - one of this selectors "#current-tasks" or "#finished-tasks"
 */
function sortBy(field, tasks) {
    order = prevSort === field ? (-1) * order : 1;
    prevSort = field;

    var sortByString = function (a, b) {
        return order * a.innerText.toLowerCase().localeCompare(b.innerText.toLowerCase());
    };

    var sortByNumber = function (a, b) {
        if (isNaN(a.innerText) || isNaN(b.innerText)) return sortByString(a, b);
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
    switch (field) {
        case ".taskTitle-col" :
            sortFunction = sortByString;
            break;
        case ".priority-col" :
            sortFunction = sortByNumber;
            break;
        case ".timeSpent-col" :
            sortFunction = sortByTimeSpent;
            break;
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