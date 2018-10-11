const assert = require('chai').assert;
const sinon = require('sinon');
const alertEmitter = require('../../src/socket/alertEmitter');

describe('alertEmitter', function () {

    const mockIo = () => {
        const eventsMap = new Map();
        const emittedEventsData = [];

        return {
            on(eventName, fn) {
                eventsMap.set(eventName, fn);
            },

            fireEvent(eventName, data) {
                eventsMap.get(eventName).call(this, data);
            },

            emit(eventName, data) {
                emittedEventsData.push(data);
            },

            getEmittedEventsData() {
                return emittedEventsData;
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
        alertEmitter.addAlert(alert, 'testAlertId', 'testUserId')
        assert.equal(alertEmitter.rooms.size, 1);
        assert.equal(alertEmitter.rooms.get('testAlertId'), 'testUserId');
        assert.equal(alertEmitter.alerts.size, 1);
        assert.isOk(alertEmitter.alerts.get('testAlertId'));
    });

    it('should remove unused alerts and rooms after disconnect', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 'testUserId'})
        alertEmitter.addAlert(alert, 'testAlertId', 'testUserId')
        io.fireEvent('disconnect')
        assert.equal(alertEmitter.rooms.size, 0);
        assert.equal(alertEmitter.alerts.size, 0);
    });

    it('should trigger alert notification', function () {
        io.fireEvent('connection', io)
        io.fireEvent('ahoj', {userId: 'testUserId'})
        let alertPromise
        alertEmitter.addAlert(() => {
            alertPromise = Promise.resolve("alert!");
            return alertPromise;
        }, 'testAlertId', 'testUserId')
        clock.next();
        return alertPromise.then(() => {
            const emittedEventsData = io.getEmittedEventsData();
            assert.isOk(emittedEventsData);
            assert.equal(emittedEventsData.length, 1);
            assert.equal(emittedEventsData[0], "alert!");
        })
    });
});