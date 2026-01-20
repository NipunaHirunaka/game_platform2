// P2P Network Manager using WebRTC
class P2PNetwork {
    constructor() {
        this.peers = new Map(); // peerId -> peer
        this.rooms = new Map(); // roomId -> Set of peers
        this.myId = this.generateId();
        this.signalingServer = 'wss://your-signaling-server.herokuapp.com'; // Optional
    }

    generateId() {
        return 'user-' + Math.random().toString(36).substr(2, 9);
    }

    // Create a new room
    createRoom() {
        const roomId = Math.random().toString(36).substr(2, 9);
        this.rooms.set(roomId, new Set([this.myId]));
        console.log('Created room:', roomId);
        return roomId;
    }

    // Join existing room
    joinRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(this.myId);
        this.broadcastToRoom(roomId, {
            type: 'playerJoined',
            playerId: this.myId,
            username: GamePlatform.currentUser?.username || 'Guest'
        });
        return true;
    }

    // Broadcast to all peers in room
    broadcastToRoom(roomId, data) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.forEach(peerId => {
            if (peerId !== this.myId) {
                this.sendToPeer(peerId, data);
            }
        });
    }

    // Send data to specific peer
    sendToPeer(peerId, data) {
        // In GitHub Pages environment, we'll use localStorage as a fallback
        // For real P2P, use WebRTC
        const message = {
            from: this.myId,
            data: data,
            timestamp: Date.now()
        };
        
        // Broadcast via storage event (simple pub/sub)
        localStorage.setItem('game-msg-' + Date.now(), JSON.stringify({
            target: peerId,
            message: message
        }));
    }

    // Listen for messages
    onMessage(callback) {
        window.addEventListener('storage', (e) => {
            if (e.key.startsWith('game-msg-')) {
                const msg = JSON.parse(e.newValue);
                if (msg.target === this.myId || msg.target === 'broadcast') {
                    callback(msg.message);
                }
            }
        });
    }

    // Get room players
    getRoomPlayers(roomId) {
        const room = this.rooms.get(roomId);
        return room ? Array.from(room) : [];
    }
}

// Global network instance
GamePlatform.network = new P2PNetwork();

// UI Functions
function createRoom() {
    const roomId = GamePlatform.network.createRoom();
    alert('Room created! ID: ' + roomId);
    document.getElementById('roomId').value = roomId;
}

function joinRoom() {
    const roomId = document.getElementById('roomId').value;
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }
    
    const success = GamePlatform.network.joinRoom(roomId);
    if (success) {
        alert('Joined room: ' + roomId);
        updateOnlinePlayers();
    }
}

function updateOnlinePlayers() {
    const roomId = document.getElementById('roomId').value;
    if (!roomId) return;

    const players = GamePlatform.network.getRoomPlayers(roomId);
    const list = document.getElementById('onlinePlayers');
    list.innerHTML = players.map(p => `<div>${p}</div>`).join('');
}

// Chat System
function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const roomId = document.getElementById('roomId').value;
    if (!roomId) {
        addChatMessage('System', 'Join a room first to chat');
        return;
    }

    GamePlatform.network.broadcastToRoom(roomId, {
        type: 'chat',
        message: message,
        username: GamePlatform.currentUser?.username || 'Guest'
    });

    addChatMessage('You', message);
    input.value = '';
}

function addChatMessage(sender, message) {
    const chat = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chat.appendChild(msgDiv);
    chat.scrollTop = chat.scrollHeight;
}

// Listen for chat messages
GamePlatform.network.onMessage((msg) => {
    if (msg.data.type === 'chat') {
        addChatMessage(msg.data.username, msg.data.message);
    } else if (msg.data.type === 'playerJoined') {
        addChatMessage('System', `${msg.data.username} joined the room`);
        updateOnlinePlayers();
    }
});
