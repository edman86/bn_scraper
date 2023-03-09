const express = require('express');
const ScraperController = require('./src/ScraperController.js');

const app = express();

require('dotenv').config();

const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', function (req, res) {
    res.send('Yo dude');
})

app.post('/start', async function (req, res) {
    const scraperController = new ScraperController()
    scraperController.start(req, res);
})

app.listen(PORT, () => {
    console.log(`Server is listening on ${HOSTNAME}:${PORT}`);
});
