'use strict';

// Node modules (core and downloaded)
const express = require('express'),
    hbs = require('hbs'),
    fs = require('fs'),
    Promise = require('bluebird'),
    path = require('path'),
    request = require('request');

// Set up server
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
    "BoingBoing": "http://feeds.feedburner.com/boingboing/ibag",
    "ReadWriteWeb": "http://feeds.feedburner.com/readwriteweb",
    "Mashable": "http://feeds.feedburner.com/Mashable",
    // RSS
    "Guardian": "https://www.theguardian.com/uk/rss",
    "SimplyRecipes": "http://feeds.feedburner.com/elise/simplyrecipes"
};


// Define public path
const publicPath = path.join(__dirname, '/public');

// Encode URL entered in form
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: true});

// Init empty articles var for storing retrieved data
let articles;



// Start server
app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
});

// For testing on mobile in DEV (with localhost)
// app.listen(port, '192.168.0.15' || 'localhost',function() {
//     console.log('Application worker ' + process.pid + ' started...');
//   });

// Handlebar related
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear();
});


// Enable app to use handlebars
app.set('view engine', 'hbs');


// Middleware to log server activity
// app.use((req, res, next) => {
//     var now = new Date().toString();
//     var log = `${now}: ${req.method} ${req.url}`;
//     fs.appendFile('server.log', log + '\n', (err) => {
//         if (err) {
//             console.log('Error: ', err);
//         }
//     });
//     next();
// });

// Middleware call to instruct app to display static views in public folder
app.use(express.static(__dirname + '/public'));

// Serve page on  initial load
app.get('/', (req, res) => {

    res.render('home.hbs', {
        pageTitle: 'Daily News Reader',
        pageHeading: 'Home page'
    });
});

// For form validation
const expressValidator = require('express-validator');
app.use(expressValidator());
const { check, oneOf, validationResult } = require('express-validator/check');

// 'post' handler
app.post('/', urlencodedParser, oneOf([
    check('feedName').not().isEmpty(),
    check('custom_url').not().isEmpty().isURL()
], "Please select either feed name from dropdown or enter a valid URL.")
, (req, res) => {

    // Form validation
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.send( {validation_error: errors.array()});
    } else {  
 
        let _url;

        // Defaulting to 'custom' will also ensure the getArticles (that needs 'name' arg) will not throw error
        let _name = req.body.feedName || 'custom';
        
        // If user selects from dropdown, get its URL.
        // Else, use the URL entered by user
        if (req.body.feedName) {
            _url = util.getUrl(req.body.feedName, urls);
        } else {
            _url = req.body.custom_url;
        }
    
        
        // Fetch feed using Promise API/Bluebird
        Promise.map([
            _url
        ], (url) => promise.fetchPromise(url), { concurrency: 3 })
            .then( (data) => {

                // Extract only records, ignoring meta data from the feed
                // (meta data can be used to update UI with selected feed and other details in future)
                let allRecords = JSON.parse(data[0].records);
    
                // Process records to discard information we do not need
                articles = util.getArticles(_name, allRecords);
    
                // Send articles to AJAX function in main.js
                res.send(articles);
    
            }).catch((err) => {
                // Send errors to calling function in main.js
                res.send({"fetch_error": err.message});
            }); 
 
        }

});


// Route to display selected article - when user clicks on image
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



//  CODE USED IN PRIOR IMPLEMENTATION (HTTP GET instead of currently used POST)
//  Update home page when new feed is requested
// app.get('/update', (req, res) => {

//     // Get name from params in click event handler in main.js
//     let _name = req.query.site_name;
//     // Retrieve name of website based on URL chosen
//     let _url = util.getUrl(_name, urls);

//     // Fetch feed using Promise API/Bluebird
//     Promise.map([
//         _url
//     ], (url) => promise.fetchPromise(url), { concurrency: 3 })
//         .then( (data) => {
//             // Extract only records, ignoring meta data from the feed
//             let allRecords = JSON.parse(data[0].records);

//             // Process records to discard information we do not need
//             articles = util.getArticles(_name, allRecords);

//             // Send articles to AJAX function in main.js
//             res.send(articles);

//         });

// });
