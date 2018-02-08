const path = require('path');
const http = require('http');
const express = require('express');
const hbs = require('hbs');

// const publicPath = path.join(__dirname, '\\..\\public');
// console.log(publicPath);

const port = process.env.PORT || 3000;
let app = express();

hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('getCurrentYear', () =>{
    return new Date().getFullYear();
});

hbs.registerHelper('scream', (text) => {
    return text.toUpperCase();
});

app.set('view engine', 'hbs');
app.use(express.static(__dirname + '\\public'));

app.use((req,res, next) => {

});

app.get('/', (req, res) => {
    // res.send('<h1>Hello Express!</h1>');
   res.render('home.hbs', {
       pageHeading: 'Home Page',
       pageTitle: 'My Feed Reader'
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