const { LIST_AM } = require('./config');

const apartmentsRent = [
    'title',
    'price',
    'currency',
    'paymentfrequency',
    'agency',
    'location',
    'description',
    'construction type',
    'new construction',
    'elevator',
    'floors in the building',
    'floor',
    'number of rooms',
    'number of bathrooms',
    'floor area',
    'ceiling height',
    'balcony',
    'renovation',
    'publishedid',
    'publisherphonenumber',
    'publisheddate',
    'renewed',
    'url',
    'code'
];

const apartmentsSale = [
    'title',
    'price',
    'currency',
    'location',
    'description',
    'construction type',
    'new construction',
    'elevator',
    'floors in the building',
    'floor',
    'number of rooms',
    'number of bathrooms',
    'floor area',
    'ceiling height',
    'balcony',
    'renovation',
    'publishedid',
    'publisherphonenumber',
    'publisheddate',
    'renewed',
    'url',
    'agency',
    'code'
];

const housesRent = [
    'title',
    'price',
    'currency',
    'paymentfrequency',
    'agency',
    'location',
    'description',
    'type',
    'construction type',
    'floors in the building',
    'number of rooms',
    'number of bathrooms',
    'floor area',
    'land area',
    'renovation',
    'publishedid',
    'publisherphonenumber',
    'publisheddate',
    'renewed',
    'url',
    'code'
];

const housesSale = [
    'title',
    'price',
    'currency',
    'location',
    'description',
    'type',
    'construction type',
    'floors in the building',
    'number of rooms',
    'number of bathrooms',
    'floor area',
    'land area',
    'renovation',
    'publishedid',
    'publisherphonenumber',
    'publisheddate',
    'renewed',
    'url',
    'code',
    'agency'
];

const commercialRent = [
    'title',
    'price',
    'currency',
    'location',
    'description',
    'type',
    'floor area',
    'publishedid',
    'publisherphonenumber',
    'publisheddate',
    'renewed',
    'url',
    'agency',
    'urgent!',
    'code'
];

const commercialSale = [
    'title',
    'price',
    'currency',
    'location',
    'description',
    'type',
    'construction type',
    'floor area',
    'publishedid',
    'publisheddate',
    'publisherphonenumber',
    'renewed',
    'url',
    'urgent!',
    'code',
    'agency'
];

const getFilterArray = (dealType, propertyType) => {
    if (propertyType === 'apartment') {
        if (dealType === 'rent') {
            return apartmentsRent;
        } else if (dealType === 'sale') {
            return apartmentsSale;
        }
    } else if (propertyType === 'house') {
        if (dealType === 'rent') {
            return housesRent;
        } else if (dealType === 'sale') {
            return housesSale;
        }
    } else if (propertyType === 'commercial') {
        if (dealType === 'rent') {
            return commercialRent;
        } else if (dealType === 'sale') {
            return commercialSale;
        }
    }
};

const filter = (dealType, propertyType) => {
    const filterArray = getFilterArray(dealType, propertyType);

    // console.log('filterArray =>', filterArray);

    return (objWithProperties) => {
        const mappedObj = {};
        for (let prop in objWithProperties) {
            // console.log('prop =>', prop);
            if (filterArray.includes(prop.toLowerCase())) {
                // console.log('included prop =>', prop);
                mappedObj[prop] = objWithProperties[prop];
            }
        }

        return mappedObj;
    }
}

const getRealEstateCategory = (dealType, propertyType) => {
    if (propertyType === 'apartment') {
        if (dealType === 'rent') {
            return LIST_AM.REALESTATE_CATEGORY_APARTMENT_RENT;
        } else if (dealType === 'sale') {
            return LIST_AM.REALESTATE_CATEGORY_APARTMENT_SALE;
        }
    } else if (propertyType === 'house') {
        if (dealType === 'rent') {
            return LIST_AM.REALESTATE_CATEGORY_HOUSE_RENT;
        } else if (dealType === 'sale') {
            return LIST_AM.REALESTATE_CATEGORY_HOUSE_SALE;
        }
    } else if (propertyType === 'commercial') {
        if (dealType === 'rent') {
            return LIST_AM.REALESTATE_CATEGORY_COMMERCIAL_RENT;
        } else if (dealType === 'sale') {
            return LIST_AM.REALESTATE_CATEGORY_COMMERCIAL_SALE;
        }
    }
};

module.exports = {
    filter,
    getRealEstateCategory
};
