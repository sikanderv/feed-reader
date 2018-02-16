// const hs = require('../../node_modules/handlebars');

$(document).ready(function () {


    console.log('outside click event handler');
    let $results = $('#results');
    // Initialized with dummy text so that JSON.stringify does not returned '[undefined]' for very first element
    let read_articles=['Dummy initialization text'];

    $('.fetch-btn').on('click', function (e) {

        console.log('inside click event handler');

        let name = this.id;
        let parameters = {
            site_name: name
        };
        debugger;

        $.get('/update', parameters, function (data) {
            console.log('inside get/update:', data);
            if (data instanceof Array) {
                // $(data).map(function(i, item){
                //     articles.push('<li>' + item.title + '</li');
                // });
                // $results.addClass('list-group');
                //  $results.append(articles);
                //  $results.children().addClass('list-group-item');
                debugger;

                // Filter data from server to include only unread articles
                const newArticles = data.filter(element => !JSON.parse(localStorage.readArticles.includes(element.guid)));
                alert(newArticles);

                $results.empty();
                for (let index = 0; index < newArticles.length; index++) {
                    const item = newArticles[index];
                    let articleHTML = '';
                    articleHTML += '<div class="card mb-3">'
                        + '<a target="_self" data-guid="' + item.guid + '" href="' + item.link + '" >'
                        + '<img class="card-img-top" src="' + (item.image ? item.image : "/images/placeholder.png") + '"alt="article image" />'
                        + '</a>'
                        + '<div class="card-body">'
                        + '<h4 class="h4-responsive mdb-color-text">' + item.title + '</h4>'
                        + '<p class="mdb-color-text">' + item.description + '</p>'
                        + '<p class="card-text mdb-color-text"><small class="text-muted">' + item.author + '</small></p>'
                        + '</div'
                        + '</div>';

                    $results.append(articleHTML);
                }

                saveToLocalStorage($results, name);


            } else {
                $results.html(data);
            }
        });
    });

    if (localStorage.getItem("pageState")) {
        $results.html(localStorage.getItem("pageState"));
    }


    $('#results a').on('click', function (e) {
        try {
            if (this.dataset.guid !== undefined || this.dataset.guid !== null) {
                if (jQuery.inArray(this.dataset.guid, read_articles) === -1) {
                    read_articles.push(this.dataset.guid);

                    // Save read articles data to localStorage
                    localStorage.readArticles += JSON.stringify(read_articles);
                    alert(read_articles);
                }
            } else {
                throw ('Unknown GUID for this article');
            }

        } catch (error) {
            alert(error);
        }


    });
});


function saveToLocalStorage($element, name) {

    let currentPage = $element.html();
    localStorage.pageName = name;
    localStorage.pageState = currentPage;

}

