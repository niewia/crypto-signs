const server = require('../../src/server');
const alertEmitter = require('../../src/socket/alertEmitter');
const chai = require('chai');
const request = require('supertest');
const expect = chai.expect;

describe('API Test', () => {
    describe('/', () => {
        it('get / should return index.html', async () => {
            const res = await request(server)
                .get('/');
            expect(res.text).to.be.ok;
            expect(res.type).to.equal('text/html');
            expect(res.statusCode).to.equal(200);
        });
    });

    describe('api/v1/alerts', () => {

        beforeEach(() => {
            alertEmitter.initState();
        })

        it('put / should add new alert', async () => {
            const res = await request(server)
                .put('/api/v1/alerts?pair=BTC-USD&limit=500')
                .set('authorization', 123);
            expect(res.body.alertId).to.be.ok;
            expect(res.statusCode).to.equal(200);
        });

        it('delete / should remove existing alert', async () => {
            alertEmitter.addAlert(() => Promise.resolve(), 'BTCUSD500', 123)
            const res = await request(server)
                .delete('/api/v1/alerts?pair=BTC-USD&limit=500')
                .set('authorization', 123);
            expect(res.body.removed).to.be.ok;
            expect(res.statusCode).to.equal(200);
        });

        it('delete / should return false if alert doesnt exist', async () => {
            const res = await request(server)
                .delete('/api/v1/alerts?pair=BTC-USD&limit=500')
                .set('authorization', 123);
            expect(res.body.removed).to.be.false;
            expect(res.statusCode).to.equal(200);
        });

        it('put / should block unauthorized user', async () => {
            const res = await request(server)
                .put('/api/v1/alerts?pair=BTC-USD&limit=500');
            expect(res.body.alertId).to.be.undefined;
            expect(res.statusCode).to.equal(401);
        });

        it('delete / should block unauthorized user', async () => {
            const res = await request(server)
                .delete('/api/v1/alerts?pair=BTC-USD&limit=500');
            expect(res.body.removed).to.be.undefined;
            expect(res.statusCode).to.equal(401);
        });
    });
});