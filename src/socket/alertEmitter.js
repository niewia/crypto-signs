class alertEmitter {

    init(io) {
        this.initState();
        io.on('connection', (user) => {
            user.on('ahoj', userData => {
                this.users.set(userData.userId, user);

                user.on('disconnect', () => {
                    this.users.delete(userData.userId);
                    this.rooms.forEach((users, roomId) => {
                        const index = users.indexOf(userData.userId);
                        if (index > -1) {
                            users.splice(index, 1);
                            if (users.length === 0) {
                                this.rooms.delete(roomId);
                                const alert = this.alerts.get(roomId);
                                clearInterval(alert);
                                this.alerts.delete(roomId);
                            }
                        }
                    })
                });

                user.emit('userSet', userData);
            })
        });
    }

    initState() {
        this.interval = 5000;
        this.users = new Map();
        this.rooms = new Map();
        this.alerts = new Map();
    }

    addAlert(alertGenerator, alertId, userId) {
        const alertExists = this.alerts.get(alertId);
        if (!alertExists) {
            const alert = setInterval(() => {
                alertGenerator().then(data => {
                    if (data) {
                        this.emitAlert(alertId, data)
                    }
                })
            }, this.interval);
            this.alerts.set(alertId, alert);
        }
        if (this.rooms.has(alertId)) {
            this.rooms.get(alertId).push(userId);
        } else {
            this.rooms.set(alertId, [userId])
        }
        return alertId;
    }

    removeAlert(alertId, userId) {
        let removed = false;
        const room = this.rooms.get(alertId);
        if (room) {
            const index = room.indexOf(userId);
            room.splice(index, 1);
            if (room.length === 0) {
                this.rooms.delete(alertId);
                const alert = this.alerts.get(alertId);
                if (alert) {
                    clearInterval(alert);
                    this.alerts.delete(alertId);
                    removed = true;
                }
            }
        }
        return removed;
    }

    emitAlert(id, data) {
        const room = this.rooms.get(id);
        if (room) {
            room.forEach(member => {
                const socket = this.users.get(member);
                if (socket) {
                    socket.emit('alert', data);
                }
            })
        }
    }
}

module.exports = new alertEmitter()