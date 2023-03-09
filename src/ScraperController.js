const { v4: uuidv4 } = require('uuid');
const ScraperService = require('./ScraperService.js');

class ScraperController {
    constructor() { }

    async start(req, res) {
        try {
            const { source, dealType, propertyType } = req.body;

            const uuid = uuidv4();

            const scraperService = new ScraperService(source);
            scraperService.start(uuid, dealType, propertyType);

            return res.json({
                success: true,
                data: {
                    uuid,
                    dealType,
                    propertyType,
                    status: 'Pending',
                },
            });
        } catch (e) {
            throw new Error('ScraperController:start:FAILED');
        }
    }
}

module.exports = ScraperController;
