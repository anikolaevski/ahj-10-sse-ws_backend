/* eslint-disable no-case-declarations */
const http = require('http');
const Koa = require('koa');
const uuid = require('uuid');
const { Message } = require('./message.js');

const app = new Koa();
const WS = require('ws');

const users = [];
const chat = [];
const remUsers = [];

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }
  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUD, DELETE, PATCH',
    });
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
    ctx.response.status = 204;
  }
});

// ready state
// const short CONNECTING = 0;
const WS_OPEN = 1;
// const short CLOSING = 2;
// const short CLOSED = 3;

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });
const wsClients = {};

const errCallback = (err) => {
  if (err) {
  // TODO: handle error
    console.log(err);
  }
};

wsServer.on('connection', (ws, req) => {
  const id = uuid.v4();
  wsClients[id] = ws;

  ws.on('message', (msg) => {
    if (msg.includes('{')) {
      // console.log('this', ws);
      parseMessage(msg, ws);
      Broadcast(msg);
    } else {
      console.log(msg);
    }
  });

  ws.send('welcome', errCallback);
});

setInterval(() => { testReleased()}, 15000);
server.listen(port);

function testReleased() {
  // test for closed connections
  for (const key of Object.keys(wsClients)) {
    if (Object.keys(wsClients[key]).includes('ChatUser')) {
      if (wsClients[key].readyState !== WS_OPEN) {
        // collect released users
        remUsers.push({
          name: wsClients[key].ChatUser,
          isMe: false,
        });
        // remove user from users list
        const k = users.findIndex((o) => o.name === wsClients[key].ChatUser);
        if (k > -1) {
          users.splice(k, 1);
        }
        // close connection
        wsClients[key].close();
        delete wsClients[key];
      }
    }
  }
  console.log('released users', remUsers, 'ws');
  // Object.keys(wsClients).forEach((o) => {
  //   console.log(o, wsClients[o].ChatUser);
  // });

  // prepare Broadcast message of released users
  if (remUsers.length > 0 ) {
    const message = new Message({
      user: 'system',
      typ: 'released',
      text: JSON.stringify(remUsers),
    });
    remUsers.splice(0, remUsers.length);
    Broadcast(JSON.stringify(message));
  }
}

function Broadcast(msg) {
  const message = JSON.parse(msg);
  for (const key of Object.keys(wsClients)) {
    if (wsClients[key].readyState == WS_OPEN) {
      if (message.typ == 'newUser') {
        wsClients[key].send(JSON.stringify({
          id: message.id,
          created: message.created,
          user: message.user,
          typ: message.typ,
          text: JSON.stringify(users),
        }), errCallback);
      } else {
        wsClients[key].send(msg, errCallback);
      }
    }
  }
}

function parseMessage(msg, ws) {
  const message = JSON.parse(msg);
  // console.log(message);
  if (!chat.find((o) => o.id === message.id)) {
    if (message.typ === 'newUser') {
      console.log('new.user', message.user);
      if (ws) {
        ws.ChatUser = message.user;
      }
      for (const item of JSON.parse(message.text)) {
        // console.log(item);
        if (!users.find((o) => o.name === item.name)) {
          users.push(item);
        }
      }
    } else {
      chat.push(message);
    }
  }
  // console.log(users, Object.keys(wsClients));
}
