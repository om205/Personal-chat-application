const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const path = require('path')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

function getRooms(roomMap) {
    const rooms = []
    roomMap.forEach((users,room) => {
        if(users.size === 1 && users.values().next().value === room) return
        rooms.push(room)
    })
    return rooms
}

io.on('connection', (socket) => 
{
    console.log('New WEb Socket Connection')
    socket.emit('roomList', getRooms(io.sockets.adapter.rooms))
    
    
    socket.on('join', (options, cb) => {
        const {error, user} = addUser({ id: socket.id, ...options })
        if(error)
        return cb(error)
        
        
        socket.join(user.room)
        // const rooms = (io.sockets.adapter.rooms)
        // rooms.forEach((value,key,maps) => {
        //     console.log(`${key} : `)
        //     value.forEach(value => console.log(` ${value},`))
        // });

        socket.emit('message', generateMessage('admin', 'Welcome'))
    
        socket.broadcast.to(user.room).emit('message', generateMessage('admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        cb()
    })

    socket.on('sendMessage', (msg, callback) => {
            const filter = new Filter()
            if(filter.isProfane(msg))
            return callback('Profanity is not allowed!')
            const user = getUser(socket.id)
            io.to(user.room).emit('message', generateMessage(user.username, msg))
            callback()
    })

    socket.on('sendLocation', (location, cb) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        cb()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(!user)
        return
        io.to(user.room).emit('message', generateMessage('admin', `${user.username} has left`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })
})



server.listen(port, ()=> console.log(`server is running on port ${port}`))