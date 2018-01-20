import { Rooms, join, leave } from './rooms'
import { map } from 'ramda'
import uuid from 'uuid/v1'

const clients = []

const greet = user =>
  JSON.stringify({
    type: 'message',
    username: 'Welcome bot',
    text: `${user} has joined the chat`
  })

const welcome = user => client => client.send(greet(user))

const joinRoom = client => (msg, rooms) => {
  welcome(msg.username)(client)
  return rooms.map(join(msg.room)(client))
}

const send = (msg, rooms) => {
  return rooms.get(msg.room, room =>
    map(x => x.send(JSON.stringify(msg)), room.sockets)
  )
}

// TODO: rooms will eventually need to be "joined" from rooms user joined
// that are saved in a database, so they will most likely not be able to be solved in this fashion.
// Possible solutions:
//   1. Add something redux like to handle rooms. something with get & dispatch methods.
//   2. Keep it like this, and have the rooms be filled on connection. Possibly a great option, as
//   this should be fine scaling horizontally? If the chat app needs to scale too much I will be
//   re-wriitng in Go anyway, so don't trip either way.

module.exports = wss => {
  let rooms = Rooms()
  wss.on('connection', (ws, req) => {
    ws.id = uuid()
    clients.push(ws)
    const join = joinRoom(ws)

    ws.on('message', message => {
      const msg = JSON.parse(message)
      if (msg.type === 'message') rooms = send(msg, rooms)
      if (msg.type === 'joinroom') rooms = join(msg, rooms)
    })

    ws.on('close', connection => {
      // connection.terminate()
    })

    ws.on('error', console.error)
  })
}