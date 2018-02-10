'use strict';

// Node modules (core and downloaded)
const   express = require('express'),
        hbs = require('hbs'),
        fs = require('fs'),
        Promise = require('bluebird'),
        request = require('request');

// User-created modules
const   data = require('./data.js'),
        promise = require('./promise.js'),
        util = require('./util.js');


// Unused - delete from package.json later**
const   path = require('path'),
        http = require('http'),
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

// Program variables
let app = express();
let selectedURL = urls.TechCrunch;
let articles;

// Fetch feed using promises
Promise.map([
    selectedURL
], (url) => promise.fetchPromise(url), {concurrency: 3}) 
.then((feeds) => {
    // Extract only record info, ignoring meta info
    let allRecords = JSON.parse(feeds[0].records); 
    // Process records
    articles = util.getArticles(selectedURL, allRecords);
});

// Views/Handlebar related
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('getCurrentYear', () =>{
    return new Date().getFullYear();
});

// hbs.registerHelper('scream', (text) => {
//     return text.toUpperCase();
// });

// Enable app to use handlebars
app.set('view engine', 'hbs');


// Middleware call #1 - logging server activity
app.use((req,res, next) => {
    var now = new Date().toString();
    var log = `${now}: ${req.method} ${req.url}`;
    console.log(log);
    fs.appendFile('server.log', log + '\n', (err) => {
        if (err) {
            console.log('Unable to append to server.log.');
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
    // res.send('<h1>Hello Express!</h1>');
    res.render('home.hbs', {
       pageHeading: 'Home Page',
       pageTitle: 'Your Feed Reader',
       contents: JSON.stringify(articles, undefined,2)
   });
});


app.get('/about', (req, res) =>{
    // res.send('About Page');
    res.render('about.hbs', {
        pageTitle: 'About Page'
    });
});

app.get('/bad', (req, res) =>{
    res.send({
        errorMessage: 'Something went wrong'
    });
});


app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
});


/* PLAYGROUND */
// let test1 = '<p>Shadow chancellor says Labour’s public ownership agenda is an economic necessity</p><p>Labour’s plans to bring services into public ownership would cost “absolutely nothing”, John McDonnell has said.</p><p>The shadow chancellor outlined an agenda to put public services “irreversibly in the hands of workers” so they could “never again be taken away”. </p> <a href="https://www.theguardian.com/uk-news/2018/feb/10/john-mcdonnell-says-moving-services-to-public-hands-would-cost-nothing">Continue reading...</a>';
// console.log(util.strip_html_tags(test1));
// console.log(sanitize_html(test1, {
//                         allowedTags: ['p'],
//                         allowedAttributes: []
//                     }));


// const publicPath = path.join(__dirname, '\\..\\public');
// console.log(publicPath);
