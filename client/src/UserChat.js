import React, { useState, useEffect, useRef } from 'react';

function UserChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // const wsUrl = `${protocol}://watch-dog-llm.vercel.app`;
    // const wsUrl = "https://watch-dog-llm.vercel.app";
    // const wsUrl = "http://54.252.184.92:5000";
    const wsUrl = "http://localhost:5000"
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      console.log('Received message:', event.data);
      setMessages((prevMessages) => [...prevMessages, { role: 'bot', content: event.data }]);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      setTimeout(connectWebSocket, 5000);
    };
  };

  const sendMessage = () => {
    if (input.trim() === '' || !isConnected) return;

    console.log('Sending message:', input);
    setMessages((prevMessages) => [...prevMessages, { role: 'user', content: input }]);
    ws.current.send(input);
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          disabled={!isConnected}
        />
        <button onClick={sendMessage} disabled={!isConnected}>Send</button>
      </div>
    </div>
  );
}

export default UserChat;
