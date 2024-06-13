import React, { useState } from 'react';
import axios from 'axios';

const Chatbot = () => {
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);

    const sendMessage = async () => {
        try {
            const response = await axios.post('http://localhost:5005/webhooks/rest/webhook', {
                sender: 'user',
                message: message,
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            console.log('Response from server:', response.data);
    
            // Ensure response.data is an array
            if (!Array.isArray(response.data)) {
                throw new Error('Unexpected response format: data is not an array');
            }
    
            // Map over response.data assuming it's an array of objects
            const messages = response.data.map((res) => res.text);
            setChat([
                ...chat,
                { sender: 'user', message: message },
                ...messages.map(msg => ({ sender: 'bot', message: msg }))
            ]);
            setMessage('');
        } catch (error) {
            console.error('Error fetching or processing data:', error.message);
        }
    };

    return (
        <div>
            <div>
                {chat.map((chat, index) => (
                    <div key={index} style={{ textAlign: chat.sender === 'bot' ? 'left' : 'right' }}>
                        <p>{chat.message}</p>
                    </div>
                ))}
            </div>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chatbot;