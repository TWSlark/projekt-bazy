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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <>
            <div className='contentTop'>
                <h1>Chatbot</h1>
            </div>
            <div className="chat-container">
                <div className="messages-container">
                    {chat.map((chat, index) => (
                        <div key={index} className={`message ${chat.sender}`}>
                            {chat.sender === 'bot' ? (
                                <p dangerouslySetInnerHTML={{ __html: chat.message }} />
                            ) : (
                                <p>{chat.message}</p>
                            )}
                        </div>
                    ))}
                </div>
                <input
                    type="text"
                    className="message-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button className="send-button" onClick={sendMessage}>Wyślij</button>
            </div>
        </>
    );
};

export default Chatbot;