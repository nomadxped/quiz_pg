import { db } from './firebase-config.js';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
    const messagesArea = document.getElementById('messagesArea');
    const chatForm = document.getElementById('chatForm');
    const nameInput = document.getElementById('chatName');
    const messageInput = document.getElementById('chatMessage');
    const sendBtn = document.getElementById('sendBtn');

    // Pre-fill name if previously used in chat
    const savedName = localStorage.getItem('pgdca_chat_name');
    if (savedName) {
        nameInput.value = savedName;
    }

    // Set up real-time listener for messages
    const messagesRef = collection(db, 'messages');
    // Fetch last 100 messages ordered by timestamp
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    onSnapshot(q, (snapshot) => {
        messagesArea.innerHTML = '';
        if (snapshot.empty) {
            messagesArea.innerHTML = '<div style="text-align: center; color: #94a3b8; margin-top: 2rem;">No messages yet. Start the conversation!</div>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const timeStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
            
            const msgEl = document.createElement('div');
            msgEl.className = 'message-card';
            msgEl.innerHTML = `
                <div class="message-header">
                    <span class="message-author">${escapeHTML(data.studentName)}</span>
                    <span>${timeStr}</span>
                </div>
                <div class="message-text">${escapeHTML(data.text)}</div>
            `;
            messagesArea.appendChild(msgEl);
        });

        // Auto-scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }, (error) => {
        console.error("Error fetching messages:", error);
        messagesArea.innerHTML = `<div style="text-align: center; color: #ef4444; margin-top: 2rem;">Error loading messages: ${error.message}</div>`;
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const text = messageInput.value.trim();

        if (!name || !text) return;

        localStorage.setItem('pgdca_chat_name', name);
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        
        try {
            await addDoc(messagesRef, {
                studentName: name,
                text: text,
                timestamp: serverTimestamp()
            });
            messageInput.value = '';
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Could not send message. Please try again.");
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Message';
            messageInput.focus();
        }
    });

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
