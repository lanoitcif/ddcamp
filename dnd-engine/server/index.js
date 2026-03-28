/* global process */
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = process.env.PORT || 3001;

// Room state: Map<roomName, { clients: Set<ws>, state: object|null }>
const rooms = new Map();

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function getRoom(name) {
  if (!rooms.has(name)) {
    rooms.set(name, { clients: new Set(), state: null });
  }
  return rooms.get(name);
}

function broadcastToRoom(roomName, message, exclude) {
  const room = rooms.get(roomName);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const client of room.clients) {
    if (client !== exclude && client.readyState === 1) {
      client.send(data);
    }
  }
}

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('DnD Engine WebSocket Server\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomName = url.searchParams.get('room') || 'default';

  const room = getRoom(roomName);
  room.clients.add(ws);
  ws.isAlive = true;
  ws.roomName = roomName;

  log(`Client connected to room "${roomName}" (${room.clients.size} clients)`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    room: roomName,
    clients: room.clients.size,
  }));

  // Notify others in the room
  broadcastToRoom(roomName, {
    type: 'client_joined',
    clients: room.clients.size,
  }, ws);

  // Send existing state if available
  if (room.state) {
    ws.send(JSON.stringify({ type: 'sync', payload: room.state }));
  }

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      log(`Invalid JSON from client in room "${roomName}"`);
      return;
    }

    if (msg.type === 'state_update' && msg.payload) {
      room.state = msg.payload;
      broadcastToRoom(roomName, { type: 'sync', payload: msg.payload }, ws);
    } else {
      log(`Unknown message type "${msg.type}" in room "${roomName}"`);
    }
  });

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', () => {
    room.clients.delete(ws);
    log(`Client disconnected from room "${roomName}" (${room.clients.size} clients)`);

    broadcastToRoom(roomName, {
      type: 'client_left',
      clients: room.clients.size,
    });

    // Clean up empty rooms
    if (room.clients.size === 0) {
      rooms.delete(roomName);
      log(`Room "${roomName}" removed (empty)`);
    }
  });

  ws.on('error', (err) => {
    log(`WebSocket error in room "${roomName}": ${err.message}`);
  });
});

// Heartbeat: ping every 30s, terminate unresponsive clients
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      log(`Terminating unresponsive client in room "${ws.roomName}"`);
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30_000);

wss.on('close', () => {
  clearInterval(heartbeat);
});

server.listen(PORT, () => {
  log(`DnD Engine WebSocket server listening on port ${PORT}`);
});
