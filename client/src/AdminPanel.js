import React, { useState, useEffect, useRef } from 'react';

function AdminPanel() {
  const [flexId, setFlexId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnectedToUser, setIsConnectedToUser] = useState(false);
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
      setMessages((prevMessages) => [...prevMessages, { role: 'system', content: event.data }]);
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

  const connectToUser = () => {
    if (flexId.trim() === '' || !isConnected) return;
    ws.current.send(`admin:${flexId}`);
    setIsConnectedToUser(true);
  };

  const disconnectFromUser = () => {
    if (!isConnected || !isConnectedToUser) return;
    ws.current.send(`disconnect:${flexId}`);
    setIsConnectedToUser(false);
    setMessages([]);
  };

  const sendMessage = () => {
    if (input.trim() === '' || !isConnected || !isConnectedToUser) return;
    console.log('Sending message:', input);
    setMessages((prevMessages) => [...prevMessages, { role: 'admin', content: input }]);
    ws.current.send(input);
    setInput('');
  };

  useEffect(() => {
    if (ws.current) {
      ws.current.onmessage = (event) => {
        console.log('Received message:', event.data);
        if (event.data.startsWith('Connected to user') || event.data.startsWith('Disconnected from user')) {
          setMessages((prevMessages) => [...prevMessages, { role: 'system', content: event.data }]);
        } else if (event.data.startsWith('User:') || event.data.startsWith('Bot:')) {
          const [role, content] = event.data.split(': ');
          setMessages((prevMessages) => [...prevMessages, { role: role.toLowerCase(), content }]);
        } else {
          setMessages((prevMessages) => [...prevMessages, { role: 'system', content: event.data }]);
        }
      };
    }
  }, []);

  return (
    <div className="admin-panel">
      <div className="flex-id-container">
        <input
          type="text"
          value={flexId}
          onChange={(e) => setFlexId(e.target.value)}
          placeholder="Enter FLEX360_ID"
        />
        <button onClick={connectToUser} disabled={!isConnected || isConnectedToUser}>Connect</button>
        {isConnectedToUser && (
          <button onClick={disconnectFromUser}>Disconnect</button>
        )}
      </div>
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
          disabled={!isConnected || !isConnectedToUser}
        />
        <button onClick={sendMessage} disabled={!isConnected || !isConnectedToUser}>Send</button>
      </div>
    </div>
  );
}

export default AdminPanel;