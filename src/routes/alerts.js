// https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD
const express = require('express');
const router = express.Router();
const alertEmitter = require('../socket/alertEmitter');
const rates = require('../services/rates');

const createId = (coin, currency, limit) => {
    return coin + currency + limit;
}

function isAuthenticated(req, res, next) {
    if (req.headers.authorization) {
        req.userId = req.headers.authorization;
        next();
    } else {
        res.status(401);
        res.json({message: 'Unauthorized'});
    } 
}

router.put('/', isAuthenticated, function (req, res, next) {
    const pair = req.query.pair.split("-");
    const coin = pair[0];
    const currency = pair[1];
    const limit = req.query.limit;
    const userId = req.userId;
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

router.delete('/', isAuthenticated, function (req, res, next) {
    const pair = req.query.pair.split("-");
    const coin = pair[0];
    const currency = pair[1];
    const limit = req.query.limit;
    const userId = req.userId;
    const alertId = createId(coin, currency, limit);

    const removed = alertEmitter.removeAlert(alertId, userId);

    return res.json({ removed });
});

router.get('/unauthorized', function (req, res, next) {
    return res.status(401);
});

router.use(function (err, req, res, next) {
    if (res.statusCode !== 401) {
        console.error(err.stack);
        res.status(500).send('Something broke!')
    }
    next(err);
})

module.exports = router;