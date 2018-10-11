class alertEmitter {

    constructor() {
        this.interval = 5000;
        this.users = new Map();
        this.rooms = new Map();
        this.alerts = new Map();
    }

    init(io) {
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
            })
        });
    }

    addAlert(alertGenerator, id, userId) {
        const alertExists = this.alerts.get(id);
        if (!alertExists) {
            const alert = setInterval(() => {
                alertGenerator().then(data => {
                    if (data) {
                        this.emitAlert(id, data)
                    }
                })
            }, this.interval);

            this.alerts.set(id, alert);

            if (this.rooms.has(id)) {
                this.rooms.get(id).add(userId);
            } else {
                this.rooms.set(id, [userId])
            }
        }
        return id;
    }

    removeAlert(coin, currency, limit, userId) {
        const id = createId(coin, currency, limit);
        const room = this.rooms.get(id);
        const index = room.indexOf(userId);
        room.splice(index, 1);
        if (room.length === 0) {
            const alert = this.alerts.get(id);
            if (alert) {
                clearInterval(alert);
            }
        }
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