# Chat en Tiempo Real con Código de Coincidencia

Una aplicación web de chat en tiempo real que permite a dos usuarios conectarse mediante un código de sala compartido. Desarrollada con HTML, CSS y JavaScript puro en el frontend, y un servidor WebSocket en Node.js.

## Características

- Ingreso mediante código de sala compartido
- Chat en tiempo real sin necesidad de recargar la página
- Envío de mensajes de texto, imágenes y videos
- Interfaz responsiva y amigable
- Notificaciones de usuarios conectados/desconectados
- Comunicación mediante WebSockets

## Estructura de archivos

- `index.html` - Página principal de la aplicación
- `styles.css` - Estilos CSS para la interfaz
- `client.js` - Lógica del cliente para la comunicación WebSocket
- `server.js` - Servidor WebSocket con Node.js
- `package.json` - Configuración de dependencias de Node.js

## Requisitos previos

- Node.js (versión 14 o superior)
- npm (gestor de paquetes de Node.js)

## Instrucciones de instalación

1. Clona o descarga este repositorio
2. Abre una terminal en la carpeta del proyecto
3. Instala las dependencias:

```bash
npm install
```

## Instrucciones de uso

1. Inicia el servidor:

```bash
npm start
```

2. Abre tu navegador y visita: `http://localhost:3000`

3. En otra pestaña o navegador, abre la misma dirección

4. En ambas ventanas, ingresa un nombre de usuario y el mismo código de sala (por ejemplo: "ABC123")

5. ¡Comienza a chatear en tiempo real!

## Cómo funciona

1. **Conexión inicial**:
   - El usuario ingresa su nombre y un código de sala
   - El cliente se conecta al servidor WebSocket
   - Si el código coincide con otro usuario, ambos entran en la misma sala

2. **Comunicación en tiempo real**:
   - Los mensajes se envían a través de WebSockets
   - No hay necesidad de recargar la página
   - Todos los usuarios en la misma sala reciben los mensajes instantáneamente

3. **Manejo de multimedia**:
   - Las imágenes y videos se convierten a base64 para transmitirse
   - Se muestran en línea en la interfaz del chat
   - Límites de tamaño establecidos para evitar sobrecarga

## Personalización

Puedes modificar fácilmente:

- Los estilos en `styles.css` para cambiar la apariencia
- Los límites de tamaños de archivos en `client.js`
- La configuración del servidor en `server.js` (puerto, rutas, etc.)

## Consideraciones técnicas

- La aplicación utiliza WebSockets para comunicación bidireccional
- Las imágenes y videos se envían en formato base64 (adecuado para archivos pequeños)
- Para un entorno de producción, considera:
  - Implementar autenticación de usuarios
  - Usar un servicio de almacenamiento para archivos grandes
  - Configurar HTTPS para mayor seguridad
  - Añadir persistencia de mensajes con una base de datos

## Solución de problemas

- **Error de conexión WebSocket**: Verifica que el servidor esté ejecutándose
- **No se reciben mensajes**: Asegúrate de que ambos usuarios estén usando exactamente el mismo código de sala
- **Problemas con archivos grandes**: Revisa los límites establecidos en `client.js`