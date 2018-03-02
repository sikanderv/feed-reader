const sanitize_html = require('sanitize-html');

/* 
 * Remove HTML tags from a string
 */
function strip_html_tags(str) {
    if ((str === null) || (str === ''))
        return false;
    else
        str = str.toString();
    return str.replace(/<[^>]*>/g, '');
}

/* 
 * Process all the "records" from the feed and return an Articles object containing
 * guid, title, link, description, author, image
 */
function getArticles(feedName, records) {
    let feedArticles = [];
    let article = {};
    records.forEach(element => {
        article = {};
        article.guid = element.guid;
        article.title = element.title;
        article.link = element.link;
        article.description = sanitize_html(element.description, { allowedTags: ['p'], allowedAttributes: [] });
        article.author = element.author;
        article.image = getImage(feedName, element);
        feedArticles.push(article);
    });

    return feedArticles;
}

/* 
* Process the 'image' or 'media:content' tag within each record to
* return only the source of the image
* 
*/
function getImage(feedName, item) {
    switch (feedName) {
        case "Guardian":
            if (item['media:content']) {
                let arr = item['media:content'];
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i]['@'].width === "460") {
                        return arr[i]['@'].url;
                    }
                }
            };
            break;

        case "TechCrunch": {

            if (item["media:content"]) {
                let arr = item["media:content"];
                return arr[0]['@'].url;
            };
           break;
        }

        case "SimplyRecipes": {
            if (item["media:content"]) {
                let arr = item["media:content"];
                console.log(arr['@'].url);
                return arr['@'].url.replace("300x200","600x400");
            };
           break;
        }

        case "BBCSport":
            if (item.image) {
                return item.image.url;
            };
            break;

        default:
            if (item.image) {
                return item.image.url;
            };
            break;
    }
}


/* 
* Get the url based on the name of the feed
* 
*/
function getUrl(name, obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && key === name) {
            return obj[key];
        }
    }
}

module.exports = {
    strip_html_tags: strip_html_tags,
    getArticles: getArticles,
    getImage: getImage,
    getUrl: getUrl
}

