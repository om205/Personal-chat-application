const socket = io()

//elements
const $btn = document.getElementById('submit')
const $locationBtn = document.getElementById('share-location')
const $messages = document.getElementById('messages')

//templates
const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset)
    $messages.scrollTop = $messages.scrollHeight
}

socket.on('message', message => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', message => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.getElementById('sidebar').innerHTML = html
})

document.getElementById('messageForm').addEventListener('submit', (e) => {
    e.preventDefault()
    let $msgInput = e.target.elements.message
    $btn.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', $msgInput.value, (error) => {
        $btn.removeAttribute('disabled')
        if(error) return console.log(error)
        console.log('The message was delivered!')
    })
    $msgInput.value = ''
})

document.querySelector('#share-location').addEventListener('click', e => {
    if(!navigator.geolocation)
    return alert('browser dose not support geolocation')
    $locationBtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
    }, () => {
        $locationBtn.removeAttribute('disabled')
        console.log('Location was shared!')
    })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(!error) return
    alert(error)
    location.href = '/'
})