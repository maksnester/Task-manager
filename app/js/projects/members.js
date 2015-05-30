'use strict';

var membersContainer = (function () {

    /**
     *
     * @param member has format like:
     {
        "user": {
            "_id": "54f06c44047f93900a9f2cab",
            "email": "blahblah@gmail.com",
     "name": "Maxim",
     "avatar": "images/default-ava.jpg"
     },
     "role": "editor",
     "timeSpent": "1d 3h 50m"
     }
     */
    function convertMemberToHtml(member) {
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
        var html = '<div class="member col-xs-12"><div class="col-xs-3"><div class="ava-field"><img src="';
        html += member.user.avatar;

        html += '"></div></div><div class="col-xs-9"><button class="close" type="button" aria-label="Remove member">&times;</button><div class="name-field">';
        html += member.user.name;

        html += '</div><div class="email-field"><a href="mailto:';
        html += member.user.email;
        html += '">';
        html += member.user.email;

        html += '</a></div><div class="role-field">';
        html += member.role;

        html += '</div><div class="time-field">';
        html += (member.timeSpent) ? getTimeSpent(member.timeSpent) : 'none';

        html += '</div></div></div>';

        return html;
    }

    /**
     * Appends a member to view
     * @param member
     */
    var addMember = function (member) {
        membersContainer.noMembers.hide();

        membersContainer.view.append(convertMemberToHtml(member));
        membersContainer.view[0].scrollTop = membersContainer.view[0].scrollHeight;
    };

    /**
     * Replace whole members view with these members
     * @param members
     */
    var showMembers = function (members) {
        var html = "";
        if (!members || !members.length) {
            membersContainer.noMembers.show();
        } else {
            membersContainer.noMembers.hide();
            var i = 0, len = members.length;
            for (; i < len; i++) {
                html += convertMemberToHtml(members[i]);
            }
        }

        membersContainer.view.html(html);
    };

    var hideMemberByEmail = function (email) {
        // search and remove
        alert("hideMemberByEmail not implemented yet");
    };

    return {
        addMember: addMember,
        showMembers: showMembers,
        hideMemberByEmail: hideMemberByEmail
    }
})();

var newMember;
var membersModal;
var membersCounter = {
    /**
     * Add new value to previous
     * @param projectId
     * @param value
     */
    _amendBy: function (projectId, value) {
        var project = $('[data-ouid=' + projectId + ']');
        var counterSelector = $('.members', project);

        // get old value
        var field = counterSelector.text();
        var index = field.indexOf(':') + 2; // index where number starts
        var counter = parseInt(field.slice(index));

        // set new value
        field = field.slice(0, index) + (counter + value);
        counterSelector.text(field);
    },
    increase: function (projectId) {
        membersCounter._amendBy(projectId, 1);
    },
    decrease: function (projectId) {
        membersCounter._amendBy(projectId, -1);
    }
};

$(document).on('ready', function () {
    membersContainer.view = $('#membersContainer');
    membersContainer.view.on('click', function (event) {
        // close button
        if (event.target.classList && event.target.classList.contains('close')) {
            // find email field
            var q = $('.email-field', event.target.parentNode);
            if (q.length) {
                var email = q[0].innerText || q[0].textContent;
                removeMember(email, function (err) {
                    if (err) {
                        //TODO show err
                        console.error(err);
                    } else {
                        // hide member
                        event.target.parentNode.parentNode.remove();
                        membersCounter.decrease(currentProject);
                        if (!membersContainer.view.children().length) membersContainer.noMembers.show();
                    }
                });
            }
        }

        //TODO when click on role-field, enable editing roles
    });

    membersContainer.noMembers = $('#noMembers');
    membersContainer.noMembers.hide();

    newMember = $('#newMember'); // form with new member

    $('form', newMember).on('submit', function (event) {
        event.preventDefault();
        saveMember();
        return false;
    });

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
});

var currentProject;

function showMembersModal(projectId) {
    currentProject = projectId;
    console.log(projectId);
    membersModal.modal('show');
    getAllMembers(projectId, function (err, members) {
        if (err) {
            // show error
            console.error(err);
        } else {
            membersContainer.showMembers(members);
        }
    });
}

/**
 * ajax for all members user data
 * @param projectId
 * @param callback
 */
function getAllMembers(projectId, callback) {
    $.ajax({
        url: currentUrl + projectId + '/members',
        success: function (res) {
            callback(null, res);
        },
        error: function (err) {
            callback(err);
        }
    });
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
        url: currentUrl + currentProject + '/members/new',
        data: {
            email: email,
            role: role
        },
        success: function (response) {
            console.info("Member added!");
            //as response needs avatar, name, email, timeSpent for project
            membersContainer.addMember(response);
            membersCounter.increase(currentProject);
            newMember.hide();
        },
        error: function (jqXHR, status) {
            //if response contains error show error (user not found or already in members)
            console.error("Save member failed. Status: %o. Server responded with: %o", status, jqXHR);
        }
    });
}

/**
 * Send ajax to remove member from project.
 * @param email
 * @param callback
 */
function removeMember(email, callback) {
    $.ajax({
        method: "delete",
        url: currentUrl + currentProject + '/members/' + email,
        success: function () {
            callback(null);
        },
        error: function (err) {
            callback(err);
        }
    })
}