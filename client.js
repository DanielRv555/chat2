// Variables globales
let socket;
let username = '';
let roomCode = '';
let isConnected = false;

// Elementos DOM
const connectionScreen = document.getElementById('connection-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username');
const roomCodeInput = document.getElementById('room-code');
const connectBtn = document.getElementById('connect-btn');
const connectionStatus = document.getElementById('connection-status');
const currentRoomElement = document.getElementById('current-room');
const userCountElement = document.getElementById('user-count');
const leaveBtn = document.getElementById('leave-btn');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const videoInput = document.getElementById('video-input');

// Inicialización
window.addEventListener('load', init);

function init() {
    // Asignar eventos a botones
    connectBtn.addEventListener('click', connectToRoom);
    leaveBtn.addEventListener('click', leaveRoom);
    sendBtn.addEventListener('click', sendTextMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendTextMessage();
    });
    imageInput.addEventListener('change', sendImageMessage);
    videoInput.addEventListener('change', sendVideoMessage);
}

// Función para conectar al WebSocket y unirse a una sala
function connectToRoom() {
    username = usernameInput.value.trim();
    roomCode = roomCodeInput.value.trim();
    
    if (!username || !roomCode) {
        showConnectionError('Por favor ingresa tu nombre y un código de sala');
        return;
    }
    
    try {
        // Crear conexión WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        // En producción (como Render) usamos el mismo host y puerto que la aplicación web
        // En desarrollo local seguimos usando el puerto 3000
        const wsPort = window.location.hostname === 'localhost' ? ':3000' : '';
        const wsUrl = `${wsProtocol}${window.location.hostname}${wsPort}`;
        socket = new WebSocket(wsUrl);
        console.log('Conectando a WebSocket:', wsUrl);
        
        // Configurar manejadores de eventos WebSocket
        socket.onopen = () => {
            // Enviar mensaje de unión a sala
            socket.send(JSON.stringify({
                type: 'join',
                username: username,
                roomCode: roomCode
            }));
        };
        
        socket.onmessage = handleWebSocketMessage;
        
        socket.onclose = () => {
            isConnected = false;
            showScreen(connectionScreen);
            showConnectionError('Desconectado del servidor');
        };
        
        socket.onerror = (error) => {
            console.error('Error de WebSocket:', error);
            showConnectionError('Error de conexión al servidor');
        };
        
        // Mostrar mensaje de estado
        connectionStatus.textContent = 'Conectando...';
        connectionStatus.style.color = '#f39c12';
    } catch (error) {
        console.error('Error al iniciar conexión:', error);
        showConnectionError('No se pudo iniciar la conexión');
    }
}

// Manejar los mensajes recibidos por WebSocket
function handleWebSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'join_success':
                // Conexión exitosa a la sala
                isConnected = true;
                currentRoomElement.textContent = roomCode;
                userCountElement.textContent = `${data.userCount} usuarios conectados`;
                showScreen(chatScreen);
                messagesContainer.innerHTML = ''; // Limpiar mensajes anteriores
                
                // Añadir mensaje de sistema
                addSystemMessage(`Te has unido a la sala ${roomCode}`);
                break;
                
            case 'join_error':
                // Error al unirse a la sala
                showConnectionError(data.message || 'Error al unirse a la sala');
                break;
                
            case 'user_joined':
                // Notificar que un usuario se unió
                userCountElement.textContent = `${data.userCount} usuarios conectados`;
                addSystemMessage(`${data.username} se unió a la sala`);
                break;
                
            case 'user_left':
                // Notificar que un usuario salió
                userCountElement.textContent = `${data.userCount} usuarios conectados`;
                addSystemMessage(`${data.username} salió de la sala`);
                break;
                
            case 'chat_message':
                // Mostrar mensaje de chat
                displayMessage(data);
                break;
                
            default:
                console.warn('Tipo de mensaje desconocido:', data.type);
        }
    } catch (error) {
        console.error('Error al procesar mensaje:', error);
    }
}

// Salir de la sala actual
function leaveRoom() {
    if (socket && isConnected) {
        socket.send(JSON.stringify({
            type: 'leave',
            roomCode: roomCode
        }));
        socket.close();
    }
    
    isConnected = false;
    showScreen(connectionScreen);
    connectionStatus.textContent = '';
}

// Enviar mensaje de texto
function sendTextMessage() {
    const text = messageInput.value.trim();
    if (!text || !isConnected) return;
    
    sendMessage({
        type: 'chat_message',
        messageType: 'text',
        content: text,
        username: username,
        roomCode: roomCode,
        timestamp: new Date().getTime()
    });
    
    messageInput.value = '';
    messageInput.focus();
}

// Enviar imagen
function sendImageMessage(event) {
    if (!isConnected) return;
    const file = event.target.files[0];
    if (!file) return;
    
    // Verificar tipo y tamaño
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB límite
        alert('La imagen es demasiado grande. El límite es 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        sendMessage({
            type: 'chat_message',
            messageType: 'image',
            content: e.target.result,
            username: username,
            roomCode: roomCode,
            timestamp: new Date().getTime()
        });
    };
    reader.readAsDataURL(file);
    
    // Limpiar input
    event.target.value = '';
}

// Enviar video
function sendVideoMessage(event) {
    if (!isConnected) return;
    const file = event.target.files[0];
    if (!file) return;
    
    // Verificar tipo y tamaño
    if (!file.type.startsWith('video/')) {
        alert('Por favor selecciona un archivo de video válido');
        return;
    }
    
    if (file.size > 25 * 1024 * 1024) { // 25MB límite
        alert('El video es demasiado grande. El límite es 25MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        sendMessage({
            type: 'chat_message',
            messageType: 'video',
            content: e.target.result,
            username: username,
            roomCode: roomCode,
            timestamp: new Date().getTime()
        });
    };
    reader.readAsDataURL(file);
    
    // Limpiar input
    event.target.value = '';
}

// Función genérica para enviar mensajes
function sendMessage(messageData) {
    if (socket && isConnected) {
        socket.send(JSON.stringify(messageData));
        
        // Mostrar mensaje enviado inmediatamente
        displayMessage({
            ...messageData,
            isSelf: true
        });
    }
}

// Mostrar mensaje en el contenedor de mensajes
function displayMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.isSelf ? 'sent' : 'received'}`;
    
    // Crear encabezado del mensaje
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'message-sender';
    senderSpan.textContent = data.isSelf ? 'Tú' : data.username;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(data.timestamp);
    
    headerDiv.appendChild(senderSpan);
    headerDiv.appendChild(timeSpan);
    messageDiv.appendChild(headerDiv);
    
    // Procesar contenido según tipo de mensaje
    switch (data.messageType) {
        case 'text':
            const textP = document.createElement('p');
            textP.className = 'message-text';
            textP.textContent = data.content;
            messageDiv.appendChild(textP);
            break;
            
        case 'image':
            const img = document.createElement('img');
            img.className = 'message-image';
            img.src = data.content;
            img.alt = `Imagen de ${data.username}`;
            img.onclick = () => window.open(data.content, '_blank');
            messageDiv.appendChild(img);
            break;
            
        case 'video':
            const video = document.createElement('video');
            video.className = 'message-video';
            video.src = data.content;
            video.controls = true;
            messageDiv.appendChild(video);
            break;
    }
    
    // Añadir al contenedor y hacer scroll
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Añadir mensaje de sistema
function addSystemMessage(text) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.textContent = text;
    systemDiv.style.textAlign = 'center';
    systemDiv.style.margin = '10px 0';
    systemDiv.style.color = '#888';
    systemDiv.style.fontSize = '12px';
    
    messagesContainer.appendChild(systemDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Mostrar error de conexión
function showConnectionError(message) {
    connectionStatus.textContent = message;
    connectionStatus.style.color = '#e74c3c';
}

// Cambiar entre pantallas
function showScreen(screen) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    // Mostrar la pantalla solicitada
    screen.classList.add('active');
}

// Formatear timestamp a hora legible
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}