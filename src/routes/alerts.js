// https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD
const express = require('express');
const router = express.Router();
const alertEmitter = require('../socket/alertEmitter');
const rates = require('../services/rates');

const createId = (coin, currency, limit) => {
    return coin + currency + limit;
}

router.put('/', function (req, res, next) {
    const pair = req.query.pair.split("-");
    const coin = pair[0];
    const currency = pair[1];
    const limit = req.query.limit;
    const userId = req.headers.userid;
    const alertId = createId(coin, currency, limit);

    const alertGenerator = () => rates.getRates(coin, currency).then(price => {
        if (price[currency] > limit) {
            return {
                id: alertId,
                coin,
                currency,
                limit,
                price: price[currency]
            }
        }
    })

    alertEmitter.addAlert(alertGenerator, alertId, userId);

    return res.json({ alertId });
});

router.delete('/', function (req, res, next) {
    const pair = req.query.pair.split("-");
    const limit = req.query.limit;
    const userId = req.headers.userid;

    const alertId = alertEmitter.removeAlert(pair[0], pair[1], limit, userId);

    return res.json({ alertId });
});

module.exports = router;