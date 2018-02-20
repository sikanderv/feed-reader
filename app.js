'use strict';

// Node modules (core and downloaded)
const express = require('express'),
    hbs = require('hbs'),
    fs = require('fs'),
    Promise = require('bluebird'),
    path = require('path'),
    request = require('request');

const app = express();

// own modules
const   promise = require('./promise.js'),
        util = require('./util.js');

// Program-level constants
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


// Define public path
const publicPath = path.join(__dirname, '/public');

// Init empty articles var for storing retrieved data
let articles;


// Start server
app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
});

// Handlebar related
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear();
});


// Enable app to use handlebars
app.set('view engine', 'hbs');


// Middleware call to log server activity
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

// Middleware call to instruct app to display static views in public folder
app.use(express.static(__dirname + '/public'));

// Home route
app.get('/', (req, res) => {

    res.render('home.hbs', {
        pageTitle: 'Simple Feed Reader',
        pageHeading: 'Home page'
    });
});

// Update home page when new feed is requested
app.get('/update', (req, res) => {

    // Get name from params in click event handler in main.js
    let _name = req.query.site_name;
    // Retrieve name of website based on URL chosen
    let _url = util.getUrl(_name, urls);

    // Fetch feed using Promise API/Bluebird
    Promise.map([
        _url
    ], (url) => promise.fetchPromise(url), { concurrency: 3 })
        .then( (data) => {
            // Extract only records, ignoring meta data from the feed
            let allRecords = JSON.parse(data[0].records);

            // Process records to discard information we do not need
            articles = util.getArticles(_name, allRecords);

            // Send articles to AJAX function in main.js
            res.send(articles);

        });

});

// Route to display selected article
app.get('/article', (req, res) => {

    res.render('article.hbs', {
        pageTitle: 'Article view',
        pageHeading: 'Article page'
    });
});

// Route to display stats of selected article
app.get('/stats', (req, res) => {

    res.render('stats.hbs', {
        pageTitle: 'Statistics view',
        pageHeading: 'Statistics page'
    });
});