const assert = require('chai').assert;
const sinon = require('sinon');
const alertEmitter = require('../../../src/socket/alertEmitter');

describe('alertEmitter', function () {

    const mockIo = () => {
        const eventsMap = new Map();
        const emittedAlertsData = [];

        return {
            on(eventName, fn) {
                eventsMap.set(eventName, fn);
            },

            fireEvent(eventName, data) {
                eventsMap.get(eventName).call(this, data);
            },

            emit(eventName, data) {
                if (eventName === 'alert') {
                    emittedAlertsData.push(data);
                }
            },

            getEmittedAlertsData() {
                return emittedAlertsData;
            }
        }
    };

    let io;
    let alert = () => Promise.resolve();
    let clock;

    beforeEach(() => {
        clock = sinon.useFakeTimers(Date.now());
        io = mockIo();
        alertEmitter.init(io);
    })

    afterEach(function() {
        clock = sinon.restore();
      });
    

    it('should initialize', function () {
        assert.isOk(alertEmitter.users);
        assert.equal(alertEmitter.users.size, 0);

        assert.isOk(alertEmitter.rooms);
        assert.equal(alertEmitter.rooms.size, 0);
        
        assert.isOk(alertEmitter.alerts);
        assert.equal(alertEmitter.alerts.size, 0);
    });

    it('should add user after ahoj', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 123})
        assert.equal(alertEmitter.users.size, 1);
    });

    it('should remove user after disconnect', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 123})
        io.fireEvent('disconnect')
        assert.equal(alertEmitter.users.size, 0);
    });
    
    it('should set user after ahoj', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: "testUserId"})
        assert.equal(alertEmitter.users.size, 1);
    });

    it('should add new alert', function () {
        alertEmitter.addAlert(alert, 'BTCUSD500', 'testUserId')
        assert.equal(alertEmitter.rooms.size, 1);
        assert.equal(alertEmitter.rooms.get('BTCUSD500'), 'testUserId');
        assert.equal(alertEmitter.alerts.size, 1);
        assert.isOk(alertEmitter.alerts.get('BTCUSD500'));
    });

    it('should remove unused alerts and rooms after disconnect', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 'testUserId'})
        alertEmitter.addAlert(alert, 'BTCUSD500', 'testUserId')
        io.fireEvent('disconnect')
        assert.equal(alertEmitter.rooms.size, 0);
        assert.equal(alertEmitter.alerts.size, 0);
    });

    it('should trigger alert notification', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 'testUserId'})
        let alertPromise;
        alertEmitter.addAlert(() => {
            alertPromise = Promise.resolve("alert!");
            return alertPromise;
        }, 'BTCUSD500', 'testUserId')
        clock.next();
        return alertPromise.then(() => {
            const emittedEventsData = io.getEmittedAlertsData();
            assert.isOk(emittedEventsData);
            assert.equal(emittedEventsData.length, 1);
            assert.equal(emittedEventsData[0], "alert!");
        })
    });

    it('should handle multiple users with same alert', function () {
        const user1 = mockIo();
        const user2 = mockIo();
        io.fireEvent('connection', user1)
        user1.fireEvent('ahoj', {userId: 'testUserId'})
        alertEmitter.addAlert(alert, 'BTCUSD500', 'testUserId')

        io.fireEvent('connection', user2)
        user2.fireEvent('ahoj', {userId: 'testUserId2'})
        alertEmitter.addAlert(alert, 'BTCUSD500', 'testUserId2')

        assert.equal(alertEmitter.users.size, 2);
        assert.equal(alertEmitter.rooms.size, 1);
        assert.equal(alertEmitter.alerts.size, 1);

        user1.fireEvent('disconnect')
        assert.equal(alertEmitter.users.size, 1);
        assert.equal(alertEmitter.rooms.size, 1);
        assert.equal(alertEmitter.alerts.size, 1);

        user2.fireEvent('disconnect')
        assert.equal(alertEmitter.users.size, 0);
        assert.equal(alertEmitter.rooms.size, 0);
        assert.equal(alertEmitter.alerts.size, 0);
    });

    it('should remove user from room and alert after subscription canceled', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 'testUserId'})
        alertEmitter.addAlert(alert, 'BTCUSD500', 'testUserId')
        
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 'testUserId2'})
        alertEmitter.addAlert(alert, 'BTCUSD500', 'testUserId2')

        alertEmitter.removeAlert('BTCUSD500', 'testUserId');
        assert.equal(alertEmitter.rooms.size, 1);
        assert.isOk(alertEmitter.rooms.get('BTCUSD500'));
        assert.equal(alertEmitter.rooms.get('BTCUSD500').length, 1);
        assert.equal(alertEmitter.alerts.size, 1);
    });

    it('should remove empty room and cancel alert after no subscribers', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 'testUserId'})
        alertEmitter.addAlert(alert, 'BTCUSD500', 'testUserId')
        
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 'testUserId2'})
        alertEmitter.addAlert(alert, 'BTCUSD500', 'testUserId2')

        alertEmitter.removeAlert('BTCUSD500', 'testUserId');
        alertEmitter.removeAlert('BTCUSD500', 'testUserId2');

        assert.equal(alertEmitter.rooms.size, 0);
        assert.equal(alertEmitter.alerts.size, 0);
    });
});