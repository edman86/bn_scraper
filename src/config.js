const AMD = 'AMD';
const USD = 'USD';
const RUB = 'RUB';

const LIST_AM = {
    NAME: 'list.am',
    URL: 'https://www.list.am',
    REALESTATE_CATEGORY: 'category/56/',
    REALESTATE_CATEGORY_APARTMENT_RENT: 'category/56/',
    REALESTATE_CATEGORY_APARTMENT_SALE: 'category/60/',
    REALESTATE_CATEGORY_HOUSE_RENT: 'category/63/',
    REALESTATE_CATEGORY_HOUSE_SALE: 'category/62/',
    REALESTATE_CATEGORY_COMMERCIAL_RENT: 'category/59/',
    REALESTATE_CATEGORY_COMMERCIAL_SALE: 'category/199/',
    PER_PAGE_DELAY: 1000, // 1 second,
    DATE_FORMAT: 'DD-MM-YYYY',
    CLEARED_CUSTOMS: 1, // 0 - all, 1 - yes 2 - no
};

const SCRAPER_DATE_FORMAT = 'YYYY-MM-DD';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36';

DEAL_TYPES = {
    RENT: 'rent',
    SALE: 'sale'
};

PROPERTY_TYPES = {
    APARTMENT: 'apartment',
    HOUSE: 'house',
    COMMERCIAL: 'commercial'
};

module.exports = {
    AMD,
    USD,
    RUB,
    LIST_AM,
    SCRAPER_DATE_FORMAT,
    USER_AGENT
};
