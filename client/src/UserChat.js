import React, { useState, useEffect, useRef } from 'react';

function UserChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const connectWebSocket = () => {
    const wsUrl = "http://localhost:3001";
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

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: '#f0f0f0',
      maxWidth: '800px',
      margin: '0 auto',
      border: '1px solid #ccc',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        backgroundColor: '#4299e1', 
        color: 'white', 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <h1 style={{margin: 0, fontSize: '1.5rem'}}>User Chat</h1>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          style={{padding: '0.5rem', borderRadius: '4px', border: 'none'}}
        />
      </div>
      <div style={{flexGrow: 1, overflowY: 'auto', padding: '1rem'}}>
        {filteredMessages.map((msg, index) => (
          <div key={index} style={{display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '0.5rem'}}>
            <div style={{
              maxWidth: '70%', 
              padding: '0.75rem', 
              borderRadius: '0.5rem', 
              backgroundColor: msg.role === 'user' ? '#4299e1' : '#e2e8f0',
              color: msg.role === 'user' ? 'white' : 'black'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{backgroundColor: 'white', padding: '1rem', borderTop: '1px solid #ccc'}}>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            disabled={!isConnected}
            style={{flexGrow: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px'}}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected}
            style={{backgroundColor: isConnected ? '#4299e1' : '#cbd5e0', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none'}}
          >
            Send
          </button>
        </div>
      </div>
      {!isConnected && (
        <div style={{backgroundColor: '#fed7d7', color: '#9b2c2c', padding: '0.75rem', margin: '1rem'}}>
          Not connected to WebSocket. Attempting to reconnect...
        </div>
      )}
    </div>
  );
}

export default UserChat;