// const hs = require('../../node_modules/handlebars');

if ($("body").data("title") === "home") {

    $(document).ready(function () {

        // Element that contains feeds
        let $results = $('#results');
        
        // Load page with most recently accessed feed
        if (localStorage.getItem("pageState")) {
            $results.html(localStorage.getItem("pageState"));
        }
    
        // Local variables
        let unreadArticles = [];
        let articleToDisplay = [];
    
        $('.fetch-btn').on('click', function (e) {
    
            console.log('inside click event handler');
    
            // Assign name of the feed clicked (the button's id)
            let name = this.id;
    
            // Assign to another variable to be sent to the server
            let parameters = {
                site_name: name
            };
    
            $.get('/update', parameters, function (data) {
                console.log('inside get/update:', data);
                if (data instanceof Array) {
                    // $(data).map(function(i, item){
                    //     articles.push('<li>' + item.title + '</li');
                    // });
                    // $results.addClass('list-group');
                    //  $results.append(articles);
                    //  $results.children().addClass('list-group-item');
    
                    // Filter data from server to include only unread articles
                    if (localStorage.readArticles){
                        unreadArticles = data.filter(element => !JSON.parse(localStorage.readArticles.includes(element.guid)));
                    } else {
                        unreadArticles = data;
                    }
                    
                    // add the unreadArticles to localStorage to access it in 'display article' event handler code
                    if (localStorage.currentPageArticles) {
                        localStorage.currentPageArticles = '';
                    }
                    localStorage.currentPageArticles = JSON.stringify(unreadArticles);
                    // alert(unreadArticles);
    
                    populateFeedsOnPage($results, unreadArticles);
    
                    saveToLocalStorage($results, name);
    
    
                } else {
                    $results.html(data);
                }
            });
        });
    
    
        $('#results a').on('click', function (e) {
    
            e.preventDefault();
            
            if (localStorage.guid) {
                localStorage.guid = '';
            }
            localStorage.guid = this.dataset.guid;
            
    
            $.ajax({
                type: 'GET',
                url: '/article',
                success: function() {
                        // location: '/articles';
                        // alert(JSON.stringify(localStorage.currentPageArticles));   
                        window.location = '/article';  
    
                    }
                });  
        });

    });
    
};


if ($("body").data("title") === "article") {

    var data = [];

    $(document).ready(function () {
        let $stats = $('#stats');

        let $article = $('#article');
        let readArticlesGUID = [];
        let guid = localStorage.guid;
        let currentArticles = JSON.parse(localStorage.currentPageArticles);
        let articleToDisplay = currentArticles.filter(element => element.guid === guid);
        // alert(JSON.stringify(articleToDisplay));

        try {
            if (guid && articleToDisplay) {

                populateFeedsOnPage($article, articleToDisplay);
                
                data = getStats($stats, articleToDisplay);

                if (jQuery.inArray(guid, readArticlesGUID) === -1) {
                    readArticlesGUID.push(guid);

                    // Save read articles data to localStorage
                    localStorage.readArticles += JSON.stringify(readArticlesGUID);
                    // alert(readArticlesGUID);
                }

            } else {
                throw ('Unable to display the article..');
            }

        } catch (error) {
            alert(error);
        }

        var chart = AmCharts.makeChart("chartdiv", {
            "type": "pie",
            "theme": "light",
            "dataProvider": data,
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


function saveToLocalStorage($element, name) {

    let currentPageHtml = $element.html();
    localStorage.pageName = name;
    localStorage.pageState = currentPageHtml;

};

function populateFeedsOnPage(elementToPopulate, feedsArray){

    // alert(elementToPopulate.length);
    // alert(JSON.stringify(feedsArray));

    elementToPopulate.empty();
    for (let index = 0; index < feedsArray.length; index++) {
        const item = feedsArray[index];
        let articleHTML = '';
        articleHTML += '<div class="card mb-3">'
            + '<a target="_self" data-guid="' + item.guid + '" href="' + item.link + '" >'
            // + '<a target="_self" data-guid="' + item.guid + '" href="/article" >'
            + '<img class="card-img-top" src="' + (item.image ? item.image : '/images/placeholder.png') + '"alt="article image" />'
            + '</a>'
            + '<div class="card-body">'
            + '<h4 class="h4-responsive mdb-color-text">' + item.title + '</h4>'
            + '<p class="mdb-color-text">' + item.description + '</p>'
            + '<p class="card-text mdb-color-text"><small class="text-muted">' + (item.author ? item.author: 'Author Unknown') + '</small></p>'
            + '</div'
            + '</div>';
           // alert(articleHTML);

           elementToPopulate.append(articleHTML);
    }
};


function getStats($element, articleData) {

    $element.empty();

    // Get count of characters
     let description = (articleData[0].description).toLowerCase(); 
 
    // Reg exp pattern
    const pattern = /[^\u0000-\u0060\u007B-\u007F\u2019\u201C\u201D\u00B4\u02BB\u02BC\u02BB\u02B9\u055A\u02BE\u02BD+]/g;
    // const pattern = /([\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]+)/gu;

    let matched = String(description.match(pattern));
    // alert('Matched text: ' + (JSON.stringify(matched)));
    let chartData = [];
    let letter = '';
    let uniqueCharSet = [...new Set(matched)].sort();
    // alert('Unique char set: ' + JSON.stringify(uniqueCharSet));
    let totalCount = JSON.stringify(matched).length;
    // alert('Matched text length: ' + totalCount);
    // alert('Unique char set length: ' + uniqueCharSet.length);
    for (let i = 0; i < uniqueCharSet.length; i++) {
        letter = uniqueCharSet[i];
        
        if (letter !== ',') {
            
            let numberOfTimes = 0;
            for (let index = 0; index < totalCount; index++) {
                //alert(typeof matched.charAt(i));
                //alert(matched.charAt(i));
                // Ignore commas generated when matching reg exp pattern
                if (letter === matched.charAt(index)) {
                    numberOfTimes++;
                }
            }
            chartData.push({
                        "char": letter,
                        "value": numberOfTimes
                    });
            // html += `The char '${letter}' appears ${numberOfTimes} times in the description of this article.\n` + '<br>';
        }                      
    }

    return chartData;
}