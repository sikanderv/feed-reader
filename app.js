'use strict';

// Node modules (core and downloaded)

const express = require('express'),
    hbs = require('hbs'),
    fs = require('fs'),
    Promise = require('bluebird'),
    path = require('path'),
    request = require('request'),
    socketIO = require('socket.io');

var app = express();
var server = require('http').createServer(app);
var io = socketIO(server);


// User-created modules
const promise = require('./promise.js'),
    util = require('./util.js');

// const data = require('./data.js');


// Unused - delete from package.json later**
const http = require('http'),
    axios = require('axios'),
    escape_string = require('escape-string-regexp');

// Constants
const port = process.env.PORT || 3000;
const urls = {
    // Atom
    "TechCrunch": "http://feeds.feedburner.com/Techcrunch",
    "BBCSport": "https://feeds.bbci.co.uk/sport/rss.xml?edition=int",
    // RSS
    "Guardian": "https://www.theguardian.com/uk/rss"
    // "WeirdNews": "http://feeds.skynews.com/feeds/rss/strange.xml"
    // "TechMeme": https://www.techmeme.com/feed.xml
};
const publicPath = path.join(__dirname, '/public');


let selectedURL = urls.TechCrunch;
var articles;
var _contents = [];



server.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
});




// Views/Handlebar related
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear();
});

// hbs.registerHelper('scream', (text) => {
//     return text.toUpperCase();
// });

// Enable app to use handlebars
app.set('view engine', 'hbs');


// Middleware call #1 - logging server activity
app.use((req, res, next) => {
    var now = new Date().toString();
    var log = `${now}: ${req.method} ${req.url}`;
    console.log(log);
    fs.appendFile('server.log', log + '\n', (err) => {
        if (err) {
            console.log('Error: ', err);
        }
    });
    next();
});

// Middleware call #2  - maintenance mode
// Uncomment when site is in maintenance mode 
// app.use((req,res,next) => {
//     res.render('maintenance.hbs');
// });

// Middleware call #3 
// Instruct app to display public views
app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {

    res.render('home.hbs', {
        pageTitle: 'Simple Feed Reader',
        pageHeading: 'Home page'
    });
});


app.get('/update', (req, res) => {

    // retrieve params from on click event handler in main.js
    // let _url = req.query.site_url;
    let _name = req.query.site_name;
    // Retrieve name of website based on URL chosen
    let _url = getUrl(_name, urls);
    debugger;

    // Fetch feed using promises
    Promise.map([
        _url
    ], (url) => promise.fetchPromise(url), { concurrency: 3 })
        .then( (data) => {
            // Extract only record info, ignoring meta info
            // allRecords contains all the raw data from the feed
            let allRecords = JSON.parse(data[0].records);

            // Process records to discard information we do not need
            articles = util.getArticles(_name, allRecords);

            // console.log(articles);            
            res.send(articles);

            // console.log(articles);


        });

    // // // request module to process the url and return results in json format
    // requests(_url, function (data) {

    //     res.send(data);
    // });

});

app.get('/article', (req, res) => {

    console.log('/article app.js');

    // res.redirect('/article');

    res.render('article.hbs', {
        pageTitle: 'Article view',
        pageHeading: 'Article page'
    });
});

app.get('/stats', (req, res) => {

    console.log('/stats app.js');

    // res.redirect('/article');

    res.render('stats.hbs', {
        pageTitle: 'Statistics view',
        pageHeading: 'Statistics page'
    });
});

function getUrl(name, obj){
    debugger;
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && key === name) {
            return obj[key];
        }
    }
}

//     app.get('/list', (req, res) => {
//         res.render('list.hbs', {
//             pageTitle: 'List all articles',
//             pageHeading: 'List all feed items on this page',
//             contents: JSON.stringify(articles, undefined, 2)
//         });
//     });


//     app.get('/article', (req, res) => {
//         res.render('article.hbs', {
//             pageTitle: 'Display article',
//             pageHeading: 'Individiual article here'
//         });
//     });



//     app.get('/bad', (req, res) => {
//         res.send({
//             errorMessage: 'Something went wrong'
//         });
//     });


// function requests(url, callback) {
//     request(url, function (err, resp, body) {
//         var resultsArray = [];
//         console.log(typeof body);
//         console.log(body);
//         // body = JSON.parse(body);

//         // Extract only record info, ignoring meta info so that
//         // allRecords contains all the raw data from the feed

//         let allRecords = JSON.parse(body[0].records);

//         // Process records to discard information we do not need
//         articles = util.getArticles(_url, allRecords);


//         debugger;
//         if (!articles) {
//             results = "No results found";
//             callback(results);
//         } else {
//             results = articles;
//             for (let i = 0; i < results.length; i++) {
//                 resultsArray.push({ title: results[i].title });
//             };
//         }

//         callback(resultsArray);
//     })
// };

// $.ajax({
//     url: '/update'
//     , type: 'POST'
//     , dataType: 'text'
//     , data: {
//         "tech": 'http://feeds.feedburner.com/Techcrunch'
//       }
// })
//     .done(function (newData) {
//         // console.log(newData);
//         $('#results').html(dataTemplate({resArray: newData}));
//     })
//     .fail(function (err) {
//         console.log(err);
//     });







// Fetch feed using promises
// Promise.map([
//     selectedURL
// ], (url) => promise.fetchPromise(url), { concurrency: 3 })
//     .then((feeds) => {
//         // Extract only record info, ignoring meta info
//         // allRecords contains all the raw data from the feed
//         let allRecords = JSON.parse(feeds[0].records);

//         // Process records to discard information we do not eed
//         articles = util.getArticles(selectedURL, allRecords);

//         for (const url in urls) {
//             if (urls.hasOwnProperty(url) && urls[url] === selectedURL) {
//                 _contents.push({
//                     name: url,
//                     data: JSON.stringify(articles, undefined, 2)
//                 })

//             } else {
//                 _contents.push({
//                     name: url,
//                     data: "not requested"
//                 })
//             };

//             // console.log(_contents);
//             // console.log(typeof _contents);
//         }
//     });