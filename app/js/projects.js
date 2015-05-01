'use strict';

var titleInput;
var membersModal;
var membersContainer = {};
var newMember;

//remove trailing slashes
var currentUrl = (window.location.href + "/").replace(/\/*$/, "/");

$(document).ready(function () {
    titleInput = $("#newProjectModal").find("input")[0];
    $(titleInput).popover({
        html: true,
        content: '<i class="fa fa-exclamation-triangle" style="color: rgb(253, 133, 98)"></i>Title should not be empty.',
        placement: 'right',
        trigger: 'manual'
    });
    titleInput.onclick = function () {
        $(titleInput).popover('hide');
    };

    membersModal = $("#membersModal");
    $('.project').on("click", function (event) {
        // if target is 'share-button' or 'members' field
        if (event.target.classList && (event.target.classList.contains("fa-group") || event.target.classList.contains("members"))
            || event.target.firstChild.classList && event.target.firstChild.classList.contains("fa-group")) {
            showMembersModal(this.dataset.ouid);
        } else {
            openProject(this);
        }
    });

    newMember = $('#newMember');
    membersContainer.view = $('#membersContainer');
    membersContainer.addMember = function (memberData) {
        // draw it!
        // template like below:
        //      .member.col-xs-12
        //          .col-xs-3
        //            .ava-field
        //                img(src="images/default-ava.jpg")
        //          .col-xs-9
        //            button.close(type="button" aria-label="Remove member") &times;
        //            .name-field Ivan Ostapov
        //            .email-field perlrulit@mail.ru
        //            .role-field editor
        //            .time-field 2w 4d
    };

    $('form', newMember).on('submit', function (event) {
        event.preventDefault();
        saveMember();
        return false;
    });
});

function createNewProject() {
    var name = titleInput.value;
    $.ajax({
        async: false,
        data: {projectTitle: name},
        dataType: "json",
        method: "post",
        url: "/projects/new",
        success: function (res) {
            if (res._id) {
                window.location.href = currentUrl + res._id;
            } else console.warn("Response does not contain project _id.")
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (jqXHR.responseJSON.error === "emptyTitle") {
                $(titleInput).popover('show');
            }
        },
        complete: function (jqXHR, status) {
            console.info("Server responded with " + status);
        }
    });
}

function openProject(project) {
    window.location.href = currentUrl + project.dataset.ouid;
}

var currentProject;

function showMembersModal(projectId) {
    currentProject = projectId;
    console.log(projectId);
    membersModal.modal('show');
}

function getAllMembers(projectId) {
    //ajax for all members user data
}

function showNewMemberForm() {
    newMember.show();
    membersContainer.view[0].scrollTop = membersContainer.view[0].scrollHeight;
}

function saveMember() {
    var email = newMember.find('.email')[0].value;
    var role = newMember.find('.role')[0].value;

    $.ajax({
        method: "put",
        url: currentUrl + currentProject,
        data: {
            email: email,
            role: role
        },
        success: function(response) {
            console.info("Member added!");
            //as response needs avatar, name, email, timeSpent for project
            //if response contains error show error (user not found or already in members)
            membersContainer.addMember(response);
            // TODO update members count for current project
            membersModal.modal('hide');
        },
        error: function(jqXHR, status) {
            console.error("Save member failed. Status: %o. Server responded with: %o", status, jqXHR);
        }
    });
}

function showMember() {
    //adds a member to membersContainer
}