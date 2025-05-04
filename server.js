const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

// Configuración de Express
const app = express();
app.use(express.static(path.join(__dirname, './')));

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar el servidor WebSocket
const wss = new WebSocket.Server({ server });

// Almacenamiento de salas y clientes
const rooms = new Map();

// Función para obtener clientes en una sala
function getClientsInRoom(roomCode) {
    if (!rooms.has(roomCode)) {
        rooms.set(roomCode, new Set());
    }
    return rooms.get(roomCode);
}

// Función para enviar mensaje a todos los clientes en una sala
function broadcastToRoom(roomCode, message, excludeClient = null) {
    if (!rooms.has(roomCode)) return;
    
    const clients = rooms.get(roomCode);
    const messageStr = JSON.stringify(message);
    
    clients.forEach(client => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// Manejar conexiones de WebSocket
wss.on('connection', (ws) => {
    console.log('Nueva conexión WebSocket');
    
    // Propiedades para rastrear información del cliente
    ws.username = null;
    ws.roomCode = null;
    
    // Manejar mensajes recibidos
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join':
                    handleJoin(ws, data);
                    break;
                    
                case 'leave':
                    handleLeave(ws);
                    break;
                    
                case 'chat_message':
                    handleChatMessage(ws, data);
                    break;
                    
                default:
                    console.warn('Tipo de mensaje desconocido:', data.type);
            }
        } catch (error) {
            console.error('Error al procesar mensaje:', error);
        }
    });
    
    // Manejar desconexión del cliente
    ws.on('close', () => {
        handleLeave(ws);
    });
});

// Manejar petición para unirse a una sala
function handleJoin(ws, data) {
    const { username, roomCode } = data;
    
    if (!username || !roomCode) {
        ws.send(JSON.stringify({
            type: 'join_error',
            message: 'Nombre de usuario y código de sala son requeridos'
        }));
        return;
    }
    
    // Obtener o crear sala
    const clients = getClientsInRoom(roomCode);
    
    // Guardar información en la conexión WebSocket
    ws.username = username;
    ws.roomCode = roomCode;
    
    // Añadir cliente a la sala
    clients.add(ws);
    
    // Enviar confirmación al cliente
    ws.send(JSON.stringify({
        type: 'join_success',
        roomCode,
        userCount: clients.size
    }));
    
    // Notificar a otros usuarios
    broadcastToRoom(roomCode, {
        type: 'user_joined',
        username,
        userCount: clients.size
    }, ws);
    
    console.log(`Usuario ${username} se unió a la sala ${roomCode}. Total usuarios: ${clients.size}`);
}

// Manejar salida de una sala
function handleLeave(ws) {
    if (!ws.roomCode) return;
    
    const roomCode = ws.roomCode;
    const username = ws.username;
    
    // Verificar si la sala existe
    if (rooms.has(roomCode)) {
        const clients = rooms.get(roomCode);
        
        // Eliminar cliente de la sala
        clients.delete(ws);
        
        // Notificar a otros usuarios
        if (clients.size > 0) {
            broadcastToRoom(roomCode, {
                type: 'user_left',
                username,
                userCount: clients.size
            });
        } else {
            // Eliminar sala si está vacía
            rooms.delete(roomCode);
        }
        
        console.log(`Usuario ${username} salió de la sala ${roomCode}. Total usuarios: ${clients.size}`);
    }
    
    // Limpiar información del cliente
    ws.username = null;
    ws.roomCode = null;
}

// Manejar mensajes de chat
function handleChatMessage(ws, data) {
    const { roomCode, username, messageType, content } = data;
    
    // Verificar información necesaria
    if (!roomCode || !username || !messageType || !content) {
        return;
    }
    
    // Verificar que el usuario esté en la sala que dice
    if (ws.roomCode !== roomCode || ws.username !== username) {
        return;
    }
    
    // Mensaje a enviar a los demás usuarios
    const messageToSend = {
        type: 'chat_message',
        messageType,
        content,
        username,
        timestamp: data.timestamp || Date.now()
    };
    
    // Enviar a todos los clientes excepto al remitente
    broadcastToRoom(roomCode, messageToSend, ws);
}

// Iniciar servidor HTTP en el puerto especificado
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});