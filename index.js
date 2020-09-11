
const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const app = express();
const port = 5000;
const server = http.createServer(app);
const io = socketio(server);

// Routes
const defaultRoute = require('./routes/default.route');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./user');

io.on('connection', socket => {
    console.log('Has connect');
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if(error) return callback(error);

        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined!` });

        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', { user: user.name, text: message });

        callback();
    });

    socket.on('disconnect', () => {
        // console.log('User had left !!!');
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        }
    });
})

app.use(defaultRoute);

server.listen(port, () => console.log(`Server has started on port ${port}`));

