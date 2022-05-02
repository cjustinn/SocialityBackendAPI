const Express = require('express');
const cors = require('cors');

const app = Express();
app.use(cors());
app.use(Express.json());

require('dotenv').config();

const Database = require('./Schemas');
const PORT = process.env.PORT || 8080;

// Main entry point.
app.get('/', (req, res) => {
    res.status(200).json({ message: `API is listening.` });
});

// User routes.
app.post('/api/users', (req, res) => {
    if (!req.body.userData) {
        console.log("No request data received.");
        res.status(400).json({ error: `You must provide user account data.` });
    } else {
        console.log("data received");
        Database.addUser(req.body.userData).then((result) => {

            res.status(201).json({ message: `Your account was registered successfully.`, data: result });

        }).catch( err => res.status(500).json({ error: err }));
    }
});

app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;

    if (!id) { res.status(400).json({ error: "You must provide a user Firebase UUID." }); }
    else {

        Database.getUserByUUID(id).then(u => res.status(200).json({ message: "Found the target user!", data: u })).catch(err => res.status(500).json({ error: err }));

    }
});

// Get the API server listening.
Database.connect(process.env.MONGO_URL).then(() => {
    app.listen(PORT, () => {
        console.log(`API now listening on port ${PORT}.`);
    })
}).catch(err => {
    console.log(`Failed to connect to the database: ${err}`);
})