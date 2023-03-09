const RealEstateScraper = require('./RealEstateScraper.js');

class ScraperService {
    constructor(source) {
        this.source = source;
    }

    async start(uuid, dealType, propertyType) {
        console.log('ScraperService:start:START');

        const scraper = new RealEstateScraper(dealType, propertyType);
        await scraper.scrapRealEstates(dealType, propertyType);

        await console.log('SCRAPPING COMPLETED');
    }
}

module.exports = ScraperService;
