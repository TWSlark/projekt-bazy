import React, { useState } from 'react';
import axios from 'axios';

const Chatbot = () => {
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);

    const sendMessage = async () => {
        try {
            const response = await axios.post('http://localhost:5004/webhooks/rest/webhook', {
                message: message,
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            console.log('Odpowiedz od rasa:', response.data);
    
            if (!Array.isArray(response.data)) {
                throw new Error('Unexpected response format: data is not an array');
            }
    
            const messages = response.data.map((res) => res.text);
            setChat([
                ...chat,
                { sender: 'user', message: message },
                ...messages.map(msg => ({ sender: 'bot', message: msg }))
            ]);
            setMessage('');
        } catch (error) {
            console.error('Nie udało się odebrać wiadomości:', error.message);
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