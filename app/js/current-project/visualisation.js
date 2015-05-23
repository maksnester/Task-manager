var visualization = {};

$(document).on('ready', function() {
    var loader = $('.ajax-loader');

    $.ajax({
        url: currentUrl + 'timeJournal',
        success: createVis,
        error: function (err) {
            loader.hide();
            var errMsg = err.statusText;
            if (err.responseJSON) {
                errMsg = err.responseJSON.error || errMsg;
            }

            $('#visualization').html('<p>Whoops! Error occurred: "' + errMsg + '"</p>');
            console.error(err);
        }
    });

    /**
     * Transform timeJournal data for chart and show chart.
     * @param journal
     */
    function createVis (journal) {
        loader.hide();
        var groups = new vis.DataSet();
        var users = []; // ids

        journal.forEach(function (entry) {
            // collect unique names (check by user._id)
            var id = entry.user._id;
            if (users.indexOf(id) < 0) {
                users.push(id);
                groups.add({id: id, content: entry.user.name});
            }
        });

        var itemCount = journal.length;

        // create a dataset with items
        visualization.items = new vis.DataSet();
        var trackDate;
        for (var i = 0; i < itemCount; i++) {
            trackDate = moment(journal[i].date);
            visualization.items.add({
                id: i,
                group: journal[i].user._id,
                content: journal[i].task.title,
                start: trackDate.clone().subtract(journal[i].timeSpent, 'minutes'),
                end: trackDate,
                taskId: journal[i].task._id
            });
        }

        // create visualization
        visualization.container = document.getElementById('visualization');
        var options = {
            groupOrder: 'content',  // groupOrder can be a property name or a sorting function
            zoomMax: 1000*60*60*24*366,
            zoomMin: 1000*60*10,
            multiselect: true
        };

        visualization.timeline = new vis.Timeline(visualization.container);
        visualization.timeline.setOptions(options);
        visualization.timeline.setGroups(groups);
        visualization.timeline.setItems(visualization.items);

        visualization.timeline.on('doubleClick', function (properties) {
            if (properties.item === null) return;
            var i = properties.item;
            var id = visualization.items._data[i].taskId;
            var taskElem = $('[data-ouid="' + id + '"]');
            if (taskElem.length) {
                task = taskElem[0];
                showTaskEditModal();
            }
        });
    }
});