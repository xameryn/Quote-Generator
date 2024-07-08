const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

let temporaryStorage = {};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/submit-quote', (req, res) => {
    const formData = req.body;
    temporaryStorage.quoteData = formData;

    function ensureArrayAndRemoveEmptyStrings(key) {
        if (typeof formData[key] === 'string') {
            formData[key] = [formData[key]];
        } else {
            formData[key] = formData[key].filter(item => item !== '');
        }
    }

    if (!formData.reference) {
        const referenceArray = []
        const date = new Date();

        if (formData['client-name']) referenceArray.push(formData['client-name'].split(' ')[0])
        if (formData['address']) referenceArray.push(formData['address'].match(/(?:\d+\s)?([a-zA-Z\s]+)(?:\s[a-zA-Z]+)?/)[1].trim().split(' ')[0])
        if (!formData['client-name'] && !formData['address']) referenceArray.push(date.getDate())
        referenceArray.push(date.getMonth() + 1)
        referenceArray.push(date.getFullYear())        

        formData.reference = referenceArray.join('-');
    }

    formData['comment'] = Array.isArray(formData['comment']) ? formData['comment'].filter(c => c.trim() !== '') : [formData['comment']].filter(c => c && c.trim() !== '');

    ensureArrayAndRemoveEmptyStrings('comment');
    ensureArrayAndRemoveEmptyStrings('cost-description');
    ensureArrayAndRemoveEmptyStrings('cost-amount');

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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'create-quote.html'));
});

app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, 'create-quote.html'));
});

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