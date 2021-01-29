/* eslint-disable no-case-declarations */
const http = require('http');
const Koa = require('koa');
const uuid = require('uuid');

const app = new Koa();
const WS = require('ws');

const users = [];
const chat = [];

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
wsServer.on('connection', (ws, req) => {
  const id = uuid.v4();
  wsClients[id] = ws;
  const errCallback = (err) => {
    if (err) {
    // TODO: handle error
      console.log(err);
    }
  };
  ws.on('message', (msg) => {
    if (msg.includes('{')) {
      parseMessage(msg);
    } else {
      console.log(msg);
    }

    const message = JSON.parse(msg);
    // console.log(message);

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
      } else {
        wsClients[key].close();
        delete wsClients[key];
      }
    }

    // ws.send(msg, errCallback);
  });

  ws.send('welcome', errCallback);
});
server.listen(port);

function parseMessage(msg) {
  const message = JSON.parse(msg);
  // console.log(message);
  if (!chat.find((o) => o.id === message.id)) {
    if (message.typ === 'newUser') {
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
