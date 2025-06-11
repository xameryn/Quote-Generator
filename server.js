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

app.post('/submit-profile', (req, res) => {
    const profileData = req.body;
    
    if (!profileData.profileName) {
        return res.status(400).send('Profile name is required');
    }

    // Ensure arrays for tax names and rates
    if (typeof profileData.tax_names === 'string') {
        profileData.tax_names = profileData.tax_names ? [profileData.tax_names] : [];
    }
    if (typeof profileData.tax_rates === 'string') {
        profileData.tax_rates = profileData.tax_rates ? [profileData.tax_rates] : [];
    }

    // Ensure arrays for address
    if (typeof profileData.address === 'string') {
        profileData.address = profileData.address ? [profileData.address] : [];
    }

    const jsonData = JSON.stringify(profileData, null, 2);

    fs.writeFile(`profiles/${profileData.profileName}.json`, jsonData, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error saving profile');
        } else {
            res.json({ success: true, message: 'Profile saved successfully' });
        }
    });
});

app.post('/save-profile', (req, res) => {
    const profileData = req.body;
    const filename = `profiles/${profileData.profileName}.json`;
    
    fs.writeFile(filename, JSON.stringify(profileData, null, 2), (err) => {
        if (err) {
            console.error(err);
            res.json({ success: false, message: 'Error saving profile' });
        } else {
            console.log(`Profile saved: ${filename}`);
            res.json({ success: true, message: 'Profile saved successfully' });
        }
    });
});

app.post('/delete-profile', (req, res) => {
    const { profileName } = req.body;
    const filename = `profiles/${profileName}.json`;
    
    fs.unlink(filename, (err) => {
        if (err) {
            console.error(err);
            res.json({ success: false, message: 'Error deleting profile' });
        } else {
            console.log(`Profile deleted: ${filename}`);
            res.json({ success: true, message: 'Profile deleted successfully' });
        }
    });
});

app.post('/list-profiles', (req, res) => {
    fs.readdir('profiles', (err, files) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading profiles');
        } else {
            let profiles = [];
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    let data = fs.readFileSync(`profiles/${file}`);
                    profiles.push(JSON.parse(data));
                }
            });
            res.json(profiles);
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

// Update profile endpoint
app.post('/update-profile', (req, res) => {
    const profileData = req.body;
    const originalProfileName = profileData.originalProfileName;
    const newProfileName = profileData.profileName;
    
    if (!originalProfileName || !newProfileName) {
        return res.json({ success: false, error: 'Missing profile names' });
    }
    
    const profilesDir = path.join(__dirname, 'profiles');
    const originalFilePath = path.join(profilesDir, `${originalProfileName}.json`);
    const newFilePath = path.join(profilesDir, `${newProfileName}.json`);
    
    try {
        // Remove the originalProfileName from the data before saving
        delete profileData.originalProfileName;
        
        // Write the updated profile data
        fs.writeFileSync(newFilePath, JSON.stringify(profileData, null, 2));
        
        // If the profile name changed, delete the old file
        if (originalProfileName !== newProfileName && fs.existsSync(originalFilePath)) {
            fs.unlinkSync(originalFilePath);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.json({ success: false, error: error.message });
    }
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