const axios = require('axios');

module.exports = {
    getRates(coin, currency) {
        return axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=${currency}`)
            .then(price => {
                return price.data;
            })
    }
}