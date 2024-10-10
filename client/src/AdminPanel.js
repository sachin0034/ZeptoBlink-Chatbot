import React, { useState, useEffect, useRef } from 'react';

const AdminPanel = () => {
  const [flexId, setFlexId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnectedToUser, setIsConnectedToUser] = useState(false);
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
      if (event.data.startsWith('Connected to user') || event.data.startsWith('Disconnected from user')) {
        setMessages((prevMessages) => [...prevMessages, { role: 'system', content: event.data }]);
        setIsConnectedToUser(event.data.startsWith('Connected to user'));
      } else if (event.data.startsWith('User:') || event.data.startsWith('Bot:')) {
        const [role, content] = event.data.split(': ');
        setMessages((prevMessages) => [...prevMessages, { role: role.toLowerCase(), content }]);
      } else {
        setMessages((prevMessages) => [...prevMessages, { role: 'system', content: event.data }]);
      }
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
        <h1 style={{margin: 0, fontSize: '1.5rem'}}>Admin Chat</h1>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          style={{padding: '0.5rem', borderRadius: '4px', border: 'none'}}
        />
      </div>
      <div style={{backgroundColor: 'white', padding: '1rem', borderBottom: '1px solid #ccc'}}>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <input
            type="text"
            value={flexId}
            onChange={(e) => setFlexId(e.target.value)}
            placeholder="Enter USER ID"
            style={{flexGrow: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px'}}
          />
          <button
            onClick={isConnectedToUser ? disconnectFromUser : connectToUser}
            disabled={!isConnected}
            style={{
              backgroundColor: isConnected ? (isConnectedToUser ? '#f56565' : '#4299e1') : '#cbd5e0',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none'
            }}
          >
            {isConnectedToUser ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
      
      {isConnectedToUser ? (
        <>
          <div style={{flexGrow: 1, overflowY: 'auto', padding: '1rem'}}>
            {filteredMessages.map((msg, index) => (
              <div key={index} style={{display: 'flex', justifyContent: msg.role === 'admin' ? 'flex-end' : 'flex-start', marginBottom: '0.5rem'}}>
                <div style={{
                  maxWidth: '70%', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  backgroundColor: msg.role === 'admin' ? '#4299e1' : msg.role === 'system' ? '#faf089' : '#e2e8f0',
                  color: msg.role === 'admin' ? 'white' : 'black'
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
                placeholder="Type your message..."
                style={{flexGrow: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px'}}
              />
              <button
                onClick={sendMessage}
                style={{backgroundColor: '#4299e1', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none'}}
              >
                Send
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#4a5568'
          }}>
            Not Connected to Any User
          </div>
          <div style={{
            fontSize: '1rem',
            color: '#718096',
            maxWidth: '400px'
          }}>
            Enter a USER ID in the field above and click "Connect" to start a chat session with a user.
          </div>
          {!isConnected && (
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#fed7d7',
              color: '#9b2c2c',
              borderRadius: '0.5rem',
              maxWidth: '400px'
            }}>
              Not connected to WebSocket. Attempting to reconnect...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;