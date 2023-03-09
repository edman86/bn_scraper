const cheerio = require('cheerio');
const moment = require('moment'); // require
const axios = require('axios');
const _ = require('lodash');
const XLSX = require('xlsx');
const config = require('./config.js');
const { filter, getRealEstateCategory } = require('./helpers.js');

const {
    AMD,
    USD,
    RUB,
    LIST_AM,
    SCRAPER_DATE_FORMAT,
    USER_AGENT
} = config;


class RealEstateScraper {
    constructor(dealType, propertyType) {
        this.url = LIST_AM.URL;
        this.realEstateCategory = LIST_AM.REALESTATE_CATEGORY;
        this.realEstateCategory = getRealEstateCategory(dealType, propertyType);
        this.delay = LIST_AM.PER_PAGE_DELAY;
        this.fileName = `${dealType}_${propertyType}`;
        this.filter = filter(dealType, propertyType);
    }

    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async scrapRealEstates(dealType, propertyType) {
        console.log(`RealEstateScraper:scrapRealEstates:START => [${dealType} : ${propertyType}]`);

        try {
            let pageNumber = 1;
            let scrappedRealEstates = [];

            for (let i = 1; i <= pageNumber; i++) {
                const $ = await this._loadPage(pageNumber);

                // remove all top real estates (don't need it)
                // and remove all adds, in every page
                $('#star').remove();
                $('#tp').remove();

                if (this._checkNextPage($)) {
                    pageNumber++;
                }

                const perPageRealEstatesData = await this._getPerPageRealEstatesList($);

                const data = await Promise.all(perPageRealEstatesData.map(async v => {
                    return { ...v };
                }));

                scrappedRealEstates.push(...data);
                console.log('Page Number: ', i);

                // we need to "sleep" to avoid blocking
                await this.sleep(this.delay);
            }

            if (!scrappedRealEstates) {
                console.log('RealEstateScraper:scrapRealEstates:FAILED');

                throw new Error('ListAm scraping failed');
            }

            this.convertJsonToExcel(scrappedRealEstates);

            console.log('RealEstateScraper:scrapRealEstates:SUCCESS');

            return scrappedRealEstates;
        } catch (e) {
            console.log('RealEstateScraper:scrapRealEstates:FAILED');
        }
    }

    async convertJsonToExcel(data) {
        try {
            const scrapedRealEstate = `${this.fileName}.xlsx`;

            const workBook = XLSX.utils.book_new();
            const workSheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workBook, workSheet, 'RealEstates');
            XLSX.writeFile(workBook, scrapedRealEstate);
        } catch (e) {
            console.log('RealEstateScraper:convertJsonToExcel:FAILED');
        }
    }

    async _getPerPageRealEstatesList($el) {
        try {
            let data = [];
            let urls = [];
            let aTags = $el('.dl').children('a');

            // pages with 1 column listing are <dl><gl> 'a' tags </gl></dl>
            // pages with 3 column listings are <gl> 'a' tags </gl>
            // if 'dl' tag has 'gl' tag before 'a' tags
            if (aTags.length === 0) {
                aTags = $el('.gl').children('a');
            }

            let currentPageRSCount = aTags.length;

            // uncomment bottom line for get only one record (for testing)
            // currentPageRSCount = 1;

            for (let i = 0; i < currentPageRSCount; i++) {
                urls.push(await this._getUrlsById(aTags, i));
            }
            const singleRSHtmls = await this._getSingleRSHtmlPage(urls);
            const allRSProperties = await Promise.all(singleRSHtmls.map(async rsHtml => this._getRealEstateProperties(rsHtml)));
            // We don't need the ads of type 'wanted'
            const filteredAllRSProperties = allRSProperties.filter(rsProperties => !rsProperties.hasOwnProperty('wanted'));

            const mappedProperties = filteredAllRSProperties.map(this.filter);

            // data.push(filteredAllRSProperties);
            data.push(mappedProperties);

            // data is list of list of objects. We need list of objects
            return data[0];
        } catch (e) {
            console.log('RealEstateScraper:getPerPageRealEstatesList:FAILED');
        }
    }

    async _getUrlsById(aTags, rsId) {
        const url = aTags.eq(rsId).attr('href');
        return `${this.url}${url}`;
    }

    async _loadPage(page) {
        try {
            const data = await this._getRealEstatesHtmlPage(page);

            // load page DOM
            return cheerio.load(data);
        } catch (e) {
            console.log('RealEstateScraper:_loadPage:FAILED');
        }
    }

    async _getRealEstatesHtmlPage(page) {
        try {
            this._setAxiosHeader();

            const url = `${this.url}/en/${this.realEstateCategory}${page}`;
            const response = await axios.get(url);

            return response.data;
        } catch (e) {
            console.log('RealEstateScraper:_getRealEstatesHtmlPage:FAILED');
        }
    }

    async _getSingleRSHtmlPage(urls) {
        try {
            const responses = await Promise.all(urls.map(url => this._getPageData(url)));

            return _.filter(responses, (o) => !o.error).map(_ => _.data);
        } catch (e) {
            console.log('RealEstateScraper:_getSingleRSHtmlPage:FAILED');
        }
    }

    async _getPageData(url) {
        try {
            const response = await axios.get(url);

            return {
                data: response.data,
                error: false,
            };
        } catch (e) {
            console.log('RealEstateScraper:_getPageData:FAILED');

            return {
                data: null,
                error: true,
            };
        }
    }

    _checkNextPage($el) {
        try {
            let text = $el('.dlf').children('.pp').next().text();
            // check the next page exist
            if (text && text === 'Next >') {
                this.nextPage = true;
            } else {
                this.nextPage = false;
            }

            return this.nextPage;
        } catch (e) {
            console.log('RealEstateScraper:checkNextPage:FAILED');
        }
    }

    _getTitle($el) {
        return $el('.vih').children('h1').text();
    }

    _getPrice($el) {
        let paymentFrequency = null;
        const { id } = this._getFooterInfo($el);

        let priceText = $el('.xprice > span:first').text().replace(/[֏$,]|monthly|daily/g, '').trim();
        if (priceText.indexOf(' ') === '-1') {
            console.log(this._getAdUrl(id), priceText);
        }

        if ($el('.xprice').has('span').text().toLowerCase().includes('monthly')) {
            paymentFrequency = 'monthly';
        }
        if ($el('.xprice').has('span').text().toLowerCase().includes('daily')) {
            paymentFrequency = 'daily';
        }
        if (priceText) {
            return { priceText, paymentFrequency };
        }
    }

    // _getAdditionalInfo($el) {
    //     try {
    //         const additionalInfo = {};
    //         const additionalInfoTags = $el('.l');
    //         let i = 0;
    //         // if price is provided, additional info is 2nd span tag
    //         if (this._getPrice($el)) {
    //             i = 1;
    //         }
    //         // console.log('additionalInfoName...', additionalInfoTags.length)
    //         for (i; i < additionalInfoTags.length; i++) {
    //             let additionalInfoName = additionalInfoTags.eq(i).text().toLowerCase();

    //             additionalInfo[additionalInfoName] = true;
    //         }

    //         return additionalInfo;
    //     } catch (e) {
    //         Logger().error({ message: 'RealEstateScraper:getRealEstatesSinglePageProperties:FAILED', ERROR: e.message });
    //     }
    // }

    _getIsAgency($el) {
        return $el('.clabel').text().includes('Agency') ? 'Yes' : '';
    }

    _getCode($el) {
        return $el('.clabel.k').text().split(' ')[1];
    }

    _getLocation($el) {
        return $el('.loc').text();
    }

    _getDescription($el) {
        return $el("*[itemprop = 'description']").text();
    }

    _getPriceFromList($el) {
        return +$el.children('.p').text().replace(/[֏$,]/g, '').trim();
    }

    _getCurrency($el) {
        // getting currency from DOM element id "pricedown", e.g. 5000$
        const prices = $el('.price:first').text().split(' ');
        if (prices[0].includes('$')) {
            return USD;
        } else if (prices[0] || prices[1].includes('֏')) {
            return AMD;
        } else {
            return RUB;
        }
        // return $el('.price:first').text().includes('$') ? USD : AMD;
    }

    _getAttributes($el) {
        const ApartmentInfo = {};
        const attributes = {};
        // const propertyList = $el('#attr').children('.c');

        // for (let i = 0; i < propertyList.length; i++) {
        //     const item = propertyList.eq(i);

        //     const propertyKey = item.children('.t').text().trim().toLowerCase();
        //     const propertyValue = item.children('.i').text().trim().toUpperCase();

        //     ApartmentInfo[propertyKey] = propertyValue;
        // }

        // console.log('$el ----------->', $el.html());

        // const buildingInfo = $el('.gt:first').prop('innerText');

        // const listItems = $el('.attr:first').children('div');
        // console.log('listItems -------------->', listItems.length);

        const sectionsCount = 3;
        const attributesBySections = [];

        for (let i = 0; i <= sectionsCount; i++) {
            const attributes = {};

            const sectionName = $el('.gt').eq(i).text();
            attributes.sectionName = sectionName;
            attributes.sectionProperties = [];

            const sectionProperties = $el('.gt').eq(i).next().children();

            for (let elem of sectionProperties) {
                const property = {};

                const $ = cheerio.load(elem);

                const key = $('.t').text();
                const value = $('.i').text();
                property[key] = value;

                attributes.sectionProperties.push(property);
            }

            attributesBySections.push(attributes);
        }

        return attributesBySections;
    }

    _getFooterInfo($el) {
        try {
            const referenceIdText = 'Ad id';
            const dateText = 'Posted';
            const renewedText = 'Renewed';

            const footer = {
                created: null,
                id: null,
                renewed: null,
            };

            // the footer child "span" elements contain statement Created Date and statement ID
            const items = $el('.footer').children('span');

            for (let i = 0; i < items.length; i++) {
                const item = items.eq(i);

                // getting creation date
                // e.g. <span>Date: 19.06.2020</span>
                if (item.text().includes(dateText)) {
                    const date = item.text().replace(dateText, '').trim();

                    footer.created = moment(date, LIST_AM.DATE_FORMAT).format(SCRAPER_DATE_FORMAT);

                    continue;
                }

                // getting id and making statement url
                // e.g. <span>Ad reference: 14225781</span>
                // url example https://www.list.am/item/14225781
                if (item.text().includes(referenceIdText)) {
                    // Ad reference: 11942887
                    const id = +item.text().replace(referenceIdText, '').trim();

                    footer.id = id;

                    continue;
                }

                if (item.text().includes(renewedText)) {
                    const renewedDate = item.text().substring(8, 18).trim();

                    // LL format example -> November 19, 2020
                    footer.renewed = moment(renewedDate, 'LL').format(SCRAPER_DATE_FORMAT);

                    continue;
                }
            }

            return footer;
        } catch (e) {
            console.log('RealEstateScraper:getDates:FAILED');
        }
    }

    _getAdUrl(id) {
        return `${this.url}/en/item/${id}`;
    }

    async _getPublisherPhoneNumber(publisherId) {
        const url = this._getAdUrl(publisherId);
        const response = await axios.get(`${this.url}/?w=12&&i=${publisherId}`, {
            headers: {
                'Referer': url,
            },
        });
        const $ = cheerio.load(response.data);
        // e.g tel:093641777, viber://chat?number=37496692977
        const phoneNumber = $('#callPhoneInfo').find('.phones').children('a').attr('href');
        // We need to modify the string e.g tel:093641777 => 093641777
        if (phoneNumber) {
            const rawPhoneNumber = phoneNumber.replace(/\D/g, '');

            return rawPhoneNumber;
        }

        return null;
    }

    async _getRealEstateProperties(realEstateHTMLData) {
        try {
            // make DOM for request data
            const $ = cheerio.load(realEstateHTMLData);

            const properties = {};
            const { created, id, renewed } = this._getFooterInfo($);

            properties.title = this._getTitle($);
            properties.url = this._getAdUrl(id);
            properties.agency = this._getIsAgency($);
            properties.location = this._getLocation($);
            properties.publishedId = id;
            properties.publishedDate = created;
            properties.renewed = renewed;
            properties.code = this._getCode($);

            properties.publisherPhoneNumber = await this._getPublisherPhoneNumber(id);

            if (this._getPrice($)) {
                const { priceText, paymentFrequency } = this._getPrice($);
                properties.price = priceText;
                if (paymentFrequency) {
                    properties.paymentFrequency = paymentFrequency;
                }
                properties.currency = this._getCurrency($);
            }

            properties.description = this._getDescription($);

            let attributes = this._getAttributes($);

            attributes.forEach((attr) => {
                attr.sectionProperties.forEach(a => {

                    for (let [key, value] of Object.entries(a)) {
                        properties[key] = value;
                    }
                })
            })
            // console.log('attributes ------------>', attributes);

            // Object.keys(attributes).map((key) => {
            //     properties[key] = attributes[key];
            // });

            // let additionalInfo = this._getAdditionalInfo($);
            // Object.keys(additionalInfo).map((key) => {
            //     properties[key] = additionalInfo[key];
            // });

            return properties;
        } catch (e) {
            console.log('RealEstateScraper:getRealEstateProperties:FAILED');
        }
    }

    _setAxiosHeader() {
        Object.assign(axios.defaults, {
            headers: {
                'user-agent': USER_AGENT,
            },
        });
    }
}

module.exports = RealEstateScraper;
