// Code to run on load of Home page
if ($("body").data("title") === "home") {

    $(document).ready(function () {

        // Div to populate with feeds
        let $results = $('#results');
        // Initialize empty array to store data
        let unreadArticles = [];

        // Load page with most recently accessed feed results, if available
        if (localStorage.getItem("pageState") && localStorage.getItem("currentPageArticles")) {
            unreadArticles = updateLocalStorage(unreadArticles, JSON.parse(localStorage.currentPageArticles));
            populateFeedsOnPage($results, unreadArticles);
            saveCurrentPageToLocalStorage($results);
        }

        // Load new feed as selected by user
        $('.fetch-btn').on('click', function (e) {

            // Assign name of the feed clicked (the button's id)
            let name = this.id;

            // Assign to another variable to be sent to the server for fetch
            let parameters = {
                site_name: name
            };

            // Bind URL and function to route 
            $.get('/update', parameters, function (data) {

                // if server returns valid data in Array form
                if (data instanceof Array) {

                    unreadArticles = [];
                    unreadArticles = updateLocalStorage(unreadArticles, data);
                    populateFeedsOnPage($results, unreadArticles);
                    saveCurrentPageToLocalStorage($results);

                    // else append data directly to element
                } else {
                    $results.html(data);
                }
            });
        });

        // Display article when user clicks on image or 'article' button
        // Known issue - first click after loading new feed does not prevent default
        $('#results').on('click', '.btn-article', function (e) {
           
            e.preventDefault();

            // Get button/link's unique ID stored in data-* attribute
            localStorage.guid = this.dataset.guid;

            // Switch to article view/route
            $.ajax({
                type: 'GET',
                url: '/article',
                success: function () {
                    window.location = '/article';
                }
            });
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

        // Element to append article info
        let $article = $('#article');

        let readArticlesGUID = [];
        let guid = localStorage.guid;

        // Get all the articles on the current page from local store
        let currentArticles = JSON.parse(localStorage.currentPageArticles);
        // Filter article corresponding to the guid of the clicked button
        let articleToDisplay = currentArticles.filter(element => element.guid === guid);

        try {
            if (guid && articleToDisplay) {

                // Fill the element with selcted article 
                populateFeedsOnPage($article, articleToDisplay);

                // Do not add guid if it already exists in local storage
                if (jQuery.inArray(guid, localStorage.readArticles) === -1) {
                    readArticlesGUID.push(guid);

                    // Save read articles data to localStorage
                    localStorage.readArticles += JSON.stringify(readArticlesGUID);
                }

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
 * Update local storage with unread (filtered) articles
 * 
 */
function updateLocalStorage(filteredArticles, unfilteredArticles) {
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
            + '<img class="card-img-top contain" src="' + (item.image ? item.image : '/images/placeholder.png') + '"alt="article image" />'
            + '</a>'
            + '<div class="card-body">'
            + '<h4 class="h4-responsive mdb-color-text">' + item.title + '</h4>'
            + '<p class="mdb-color-text">' + item.description + '</p>'
            + '<p class="card-text mdb-color-text"><small class="text-muted">' + (item.author ? item.author : 'Author Unknown') + '</small></p>'
            + '<a role="button" target="_self" class="btn-article btn btn-sm" data-guid="' + item.guid + '"href="' + item.link + '"> Article </a>'
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