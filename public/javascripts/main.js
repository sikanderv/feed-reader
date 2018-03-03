// Code to run on load of Home page
if ($("body").data("title") === "home") {


    // Reset select dropdown when user is trying to enter custom url
    document.getElementById("custom_url").addEventListener("focus", function (e) {
        document.getElementById("feedName").value = "";
    });

    $(document).ready(function () {

        // Div to populate with feeds
        let $results = $('#results');
        // Initialize empty array to store data
        let unreadArticles = [];

        // Load page with most recently accessed feed results, if available
        if (localStorage.getItem("pageState") && localStorage.getItem("currentPageArticles")) {
            unreadArticles = getUnreadArticles(unreadArticles, JSON.parse(localStorage.currentPageArticles));
            populateFeedsOnPage($results, unreadArticles);
            saveCurrentPageToLocalStorage($results);
        }

        // Clear URL when dropdown option is selected
        $("select#feedName").on("change", function (e) {
            $("input#custom_url").val('');
        });

        // Load new feed as selected by user
        $("button#submitButton").on('click', function (e) {

            e.preventDefault();

            let $errors = $("#errors");
            $errors.html("");

            // Bind URL and function to route 
            $.post('/', $('form#feeds').serialize(), function (data) {
                // alert(JSON.stringify(data));
                let firstElement = Object.keys(data)[0];
                // alert(firstElement);

                if (firstElement === "validation_error") {
                    data[firstElement].forEach((error) => {
                        $errors.append(`<p class="alert-danger"><i class="fas fa-exclamation-triangle fa-2x"></i> ${error.msg}</p>`);
                        $results.html("");
                    });
                } else if (firstElement === "fetch_error") {
                    $errors.append(`<p class="alert-danger"><i class="fas fa-exclamation-triangle fa-2x"></i> ${data[firstElement]}</p>`);
                    $results.html("");
                } else if

                // if server returns any other valid data in Array form (means successful trip to server)
                (data instanceof Array) {

                    console.log('below data instanceof array');

                    unreadArticles = [];
                    unreadArticles = getUnreadArticles(unreadArticles, data);
                    populateFeedsOnPage($results, unreadArticles);
                    saveCurrentPageToLocalStorage($results);

                    // else append data directly to element
                } else {
                    $results.html(data);
                }
            }, 'json'
            );
        });

        // Display article when user clicks on image or 'article' button
        // Issue - first click after loading new feed does not prevent default
        // Fixed by - changing the object to #results which is already present in the DOM when page loads
        // as the button and image elements are created dynamically
        $('#results').on('click', '.btn-article', function (e) {

            e.preventDefault();

            // if user clicks on image, show the same article within app
            if (e.target.getAttribute("role") !== "button") {

                // Get button/link's unique ID stored in data-* attribute
                // so that it can be used to filter unread article
                localStorage.guid = this.dataset.guid;

                // Switch to article view/route
                $.ajax({
                    type: 'GET',
                    url: '/article',
                    success: function () {
                        window.location = '/article';
                    }
                });

                // if user clicks on 'Full Article' button, show article on originating website
            } else {

                // Get button/link's unique ID stored in data-* attribute
                // so that it can be used to filter unread article
                localStorage.guid = this.dataset.guid;

                addCurrentArticleToReadArticles();

                window.location = e.target.getAttribute("href");
            }
        });

        // Display  stats view
        $('#results').on('click', '.btn-stats', function () {

            // Get button unique ID stored in data-* attribute
            localStorage.guid = this.dataset.guid;

            // Switch to stats views
            $.ajax({
                type: 'GET',
                url: '/stats',
                success: function () {
                    window.location = '/stats';
                }
            });
        });

    });
};

// Code to run on load of Article page
if ($("body").data("title") === "article") {

    $(document).ready(function () {

        // Element where article info is to be displayed
        let $article = $('#article');
        let guid = localStorage.guid;

        // Get all the articles on the current page from local store
        let currentArticles = JSON.parse(localStorage.currentPageArticles);
        // Filter article corresponding to the guid of the clicked button
        let articleToDisplay = currentArticles.filter(element => element.guid === guid);

        try {
            if (guid && articleToDisplay) {

                // Fill the element with selected article 
                populateFeedsOnPage($article, articleToDisplay);

                // Add the article to localStorage.readArticles
                addCurrentArticleToReadArticles();

            } else {
                throw ('Unable to display the article..');
            }

        } catch (error) {
            alert(error);
        }

    });

};

if ($("body").data("title") === "stats") {

    // Init empty array to store letters and their occurence data
    var dataChart = [];

    $(document).ready(function () {

        let guid = localStorage.guid;

        // Get all the articles on the current page from local store        
        let currentArticles = JSON.parse(localStorage.currentPageArticles);
        // Filter article corresponding to the guid of the clicked button
        let articleToDisplay = currentArticles.filter(element => element.guid === guid);

        try {
            if (guid && articleToDisplay) {

                dataChart = getStats(articleToDisplay);

            } else {
                throw ('Unable to display the article..');
            }

        } catch (error) {
            alert(error);
        }

        // Create chart with the passed dataChart array
        var chart = AmCharts.makeChart("chartdiv", {
            "type": "pie",
            "theme": "light",
            "dataProvider": dataChart,
            "valueField": "value",
            "titleField": "char",
            "outlineAlpha": 0.4,
            "depth3D": 15,
            "balloonText": "[[title]]<br><span style='font-size:14px'><b>[[value]]</b> ([[percents]]%)</span>",
            "angle": 30,
            "export": {
                "enabled": false
            }
        });


    });

};



/*
 * Get latest unread (filtered) articles as well as update local storage
 * Make sure to update localStorage.guid before calling this function
 * 
 */
function addCurrentArticleToReadArticles() {

    let readArticlesGUID = [];

    // Add guid if it is not present in local storage
    if (jQuery.inArray(localStorage.guid, localStorage.readArticles) === -1) {
        
        readArticlesGUID.push(localStorage.guid);

        // Save read articles data to localStorage
        localStorage.readArticles += JSON.stringify(readArticlesGUID);
    }
}

/*
 * Get latest unread (filtered) articles as well as update local storage
 * 
 */
function getUnreadArticles(filteredArticles, unfilteredArticles) {

    // Filter data from server to include only unread articles
    if (localStorage.readArticles) {
        filteredArticles = unfilteredArticles.filter(element => !JSON.parse(localStorage.readArticles.includes(element.guid)));
    } else {
        filteredArticles = unfilteredArticles;
    }

    // Add filtered articles to localStorage
    if (localStorage.currentPageArticles) {
        localStorage.currentPageArticles = '';
    }
    localStorage.currentPageArticles = JSON.stringify(filteredArticles);

    return filteredArticles;
}


/*
 * Preserve state of page by retrieving the most recently accessed HTML from local storage
 * 
 */
function saveCurrentPageToLocalStorage($element) {

    let currentPageHtml = $element.html();
    localStorage.pageState = currentPageHtml;
};

/*
 * Fill the HTML element on page with the feeds/feed selected
 * 
 */
function populateFeedsOnPage(elementToPopulate, feedsArray) {

    elementToPopulate.empty();

    for (let index = 0; index < feedsArray.length; index++) {

        const item = feedsArray[index];
        let articleHTML = '';

        articleHTML += '<div class="card mb-3">'
            + '<a class="btn-article" target="_self" data-guid="' + item.guid + '" href="' + item.link + '" >'
            // + '<a target="_self" data-guid="' + item.guid + '" href="/article" >'
            + '<img class="card-img-top img-fluid" src="' + (item.image ? item.image : '/images/placeholder.png') + '"alt="article image" />'
            + '</a>'
            + '<div class="card-body">'
            + '<h4 class="h4-responsive mdb-color-text">' + item.title + '</h4>'
            + '<p class="mdb-color-text">' + item.description + '</p>'
            + '<p class="card-text mdb-color-text"><small class="text-muted">' + (item.author ? item.author : 'Author Unknown') + '</small></p>'
            + '<a role="button" target="_self" class="btn-article btn btn-sm" data-guid="' + item.guid + '"href="' + item.link + '"> Full Article </a>'
            + '<a role="button" class="btn btn-sm btn-stats" data-guid="' + item.guid + '"href="/stats"> Statistics </a>'
            + '</div'
            + '</div>';
        elementToPopulate.append(articleHTML);
    }
};

/*
 * Get the letters and number of occurences from the description of the article selected
 * 
 */
function getStats(articleData) {

    // Init empty array to store letter and number of times they occur
    let chartData = [];

    // Convert description of article to lowercase
    let description = (articleData[0].description).toLowerCase();

    // Reg exp to exclude Basic Latin charset except letters a-z and a few 'confusing' chars (apostrophe, double quotes)
    const pattern = /[^\u0000-\u0060\u007B-\u007F\u2019\u201C\u201D\u00B4\u02BB\u02BC\u02BB\u02B9\u055A\u02BE\u02BD+]/g;
    let matched = String(description.match(pattern));
    // Remove duplicates and sort the matched
    let uniqueCharSet = [...new Set(matched)].sort();


    let letter = '';
    let totalCount = JSON.stringify(matched).length;

    // Loop through every element in unique char set array
    for (let i = 0; i < uniqueCharSet.length; i++) {
        letter = uniqueCharSet[i];

        // Ignore commas generated when matching reg exp pattern
        if (letter !== ',') {

            let numberOfTimes = 0;
            // Lopp through the matched string to count number of times
            for (let index = 0; index < totalCount; index++) {
                if (letter === matched.charAt(index)) {
                    numberOfTimes++;
                }
            }

            // Store in chartData array
            chartData.push({
                "char": letter,
                "value": numberOfTimes
            });

        }
    }

    return chartData;
}