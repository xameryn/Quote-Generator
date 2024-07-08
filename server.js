const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { type } = require('os');

const app = express();
const port = 3000;

let temporaryStorage = {}; // This is a simple object to hold data temporarily

app.use(express.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'create-quote.html'));
});

app.post('/submit-quote', (req, res) => {
    const formData = req.body;

    temporaryStorage.quoteData = formData;

    if (!formData.reference) {
        let referenceArray = []

        let date = new Date();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();

        if (formData['client-name']) referenceArray.push(formData['client-name'].split(' ')[0]);
        if (formData['address']) referenceArray.push(formData['address'].match(/(?:\d+\s)?([a-zA-Z\s]+)(?:\s[a-zA-Z]+)?/)[1].trim().split(' ')[0]);
        if (!formData['client-name'] && !formData['address']) referenceArray.push(date.getDate());
        referenceArray.push(month);
        referenceArray.push(year);

        formData.reference = referenceArray.join('-');
    }

    if (typeof formData['comment'] === 'string') {
        formData['comment'] = [formData['comment']];
    }
    else {
        for (let comment in formData['comment']) {
            if (comment === '') delete comment;
        }
    }

    if (typeof formData['cost-description'] === 'string') {
        formData['cost-description'] = [formData['cost-description']];
    }
    else {
        for (let costDescription in formData['cost-description']) {
            if (costDescription === '') delete costDescription;
        }
    }

    if (typeof formData['cost-amount'] === 'string') {
        formData['cost-amount'] = [formData['cost-amount']];
    }
    else {
        for (let costAmount in formData['cost-amount']) {
            if (costAmount === '') delete costAmount;
        }
    }

     // Convert formData to JSON string
     const jsonData = JSON.stringify(formData);

    fs.writeFile(`quotes/${formData.reference}.json`, jsonData, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error saving quote');
        } else {
            res.redirect('/display');
        }
    });
});

app.post('/list-quotes', (req, res) => {
    fs.readdir('quotes', (err, files) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading quotes');
        } else {
            let quotes = [];
            files.forEach(file => {
                let data = fs.readFileSync(`quotes/${file}`);
                quotes.push(JSON.parse(data));
            });
            res.json(quotes);
        }
    });
});

// Serve the create quote page
app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, 'create-quote.html'));
});

// Serve the display quote page
app.get('/display', (req, res) => {
    res.sendFile(path.join(__dirname, 'display-quote.html'));
});

app.get('/quoteData', (req, res) => {
    let quoteData = temporaryStorage.quoteData;
    // delete temporaryStorage.quoteData;
    res.json(quoteData);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});