const socket = io()
const $roomList = document.getElementById('rooms')

socket.on('roomList', rooms => {
    console.log(rooms)
    rooms.forEach(room => {
        const option = document.createElement('option')
        option.setAttribute('value', room)
        $roomList.appendChild(option)
    })
})

