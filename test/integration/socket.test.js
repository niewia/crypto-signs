const alertEmitter = require('../../src/socket/alertEmitter');
const server = require('../../src/server');
const chai = require('chai');
const request = require('supertest');
const port = 3333;
const expect = chai.expect;

describe('WebSocket Test - alertEmitter', () => {
    let runningServer;

    before((done) => {
        runningServer = server.listen(port, () => {
            const io = require('socket.io')(runningServer);
            alertEmitter.init(io);
            done();
        });
    });

    it('client should be able to connect', (done) => {
        const wsClient = require('socket.io-client')('http://localhost:' + port);
        wsClient.on('connect', () => {
            wsClient.emit('ahoj', 123);
        });
        wsClient.on('userSet', (userId) => {
            expect(userId).to.equal(123);
            done();
        })
    });

    it('client should be able to recieve alert', async () => {
        const wsClient = require('socket.io-client')('http://localhost:' + port);
        wsClient.on('connect', () => {
            wsClient.emit('ahoj', { userId: "123" });
        });
        wsClient.on('userSet', async (userData) => {
            await request(server)
                .put('/api/v1/alerts?pair=BTC-USD&limit=500')
                .set('authorization', userData.userId);
        });
        const alertData = await new Promise((resolve, reject) => {
            wsClient.on('alert', (alertData) => {
                resolve(alertData);
            });
        })
        expect(alertData).to.be.ok;
        expect(alertData.price).to.be.ok;
    }).timeout(60000);
});