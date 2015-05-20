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
        var items = new vis.DataSet();
        for (var i = 0; i < itemCount; i++) {
            var trackDate = moment(journal[i].date);
            items.add({
                id: i,
                group: journal[i].user._id,
                content: journal[i].task.title,
                start: trackDate.clone().subtract(journal[i].timeSpent, 'minutes'),
                end: trackDate
            });
        }

        // create visualization
        var container = document.getElementById('visualization');
        var options = {
            groupOrder: 'content'  // groupOrder can be a property name or a sorting function
        };

        var timeline = new vis.Timeline(container);
        timeline.setOptions(options);
        timeline.setGroups(groups);
        timeline.setItems(items);
    }
});