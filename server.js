const express = require('express');
const WebSocket = require('ws');
const OpenAI = require('openai');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Change to 3001 or another port


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI);

// Defining MongoDB schema for messages
const messageSchema = new mongoose.Schema({
  flex360Id: String,
  role: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Function to save a message to MongoDB
const saveMessage = async (flex360Id, role, content) => {
  const message = new Message({ flex360Id, role, content });
  await message.save();
};

const wss = new WebSocket.Server({ noServer: true });

const userConnections = new Map();
const adminConnections = new Map();
const userDataStore = new Map();

// Function to fetch user data from an external API
async function fetchUserData(flex360Id) {
  console.log(`Attempting to fetch user data for FLEX360_ID: ${flex360Id}`);
  try {
    const response = await axios.post('https://test.attflex.com/flex360/opera/api/flexuser', 
      `flex360_id=${flex360Id}`,
      {
        headers: {
          'authtoken': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiQVRUQ2FsbFZ1IiwibmFtZSI6IkFUVCBDYWxsIFZ1IiwicGFzc3dvcmQiOm51bGwsIkFQSV9USU1FIjoxNjkxNTE2MDMxfQ.tBRxp40WbFSkzaJyXXzgKhM5Cxt4zz6RRqGlgwQVlJk',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );
    console.log('User data fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error.response ? error.response.data : error.message);
    return null;
  }
}

// WebSocket server connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  let isWaitingForId = true;
  let isAdmin = false;
  let flex360Id = null;
  let isRegistered = false;

  ws.send("Welcome! Please provide your ORDER_ID to get started, or type 'guest' to continue as an unregistered user.");

  ws.on('message', async (message) => {
    console.log('Received message:', message.toString());
    try {
      const userMessage = message.toString();

      if (isWaitingForId) {
        if (userMessage.toLowerCase() === 'guest') {
          isWaitingForId = false;
          isRegistered = false;
          ws.send("You're continuing as an unregistered user. How can I assist you today?");
          return;
        }
        
        if (userMessage.startsWith("admin:")) {
          isAdmin = true;
          flex360Id = userMessage.split(":")[1];
          if (userConnections.has(flex360Id)) {
            adminConnections.set(flex360Id, ws);
            ws.send(`Connected to user ${flex360Id}`);
            const oldConversations = await fetchOldConversations(flex360Id);
            oldConversations.forEach(msg => ws.send(`${msg.role}: ${msg.content}`));
            ws.send("You can now send messages to the user.");
          } else {
            ws.send("User not found.");
          }
          isWaitingForId = false;
        } else {
          if (!userDataStore.has(userMessage)) {
            console.log('Attempting to fetch user data for ID:', userMessage);
            const userData = await fetchUserData(userMessage);
            console.log('Fetched user data:', userData);
            if (userData && userData.FLEX360_ID) {
              console.log('User data fetched successfully. Switching to chat mode.');
              userDataStore.set(userMessage, userData);
              userConnections.set(userMessage, ws);
              flex360Id = userMessage;
              isWaitingForId = false;
              isRegistered = true;
              ws.send("Thank you. Your data has been fetched. How can I assist you today?");
            } else {
              console.log('Failed to fetch user data. Asking for FLEX360_ID again.');
              ws.send("I'm sorry, I couldn't fetch your data. Please try again with a valid FLEX360_ID or type 'guest' to continue as an unregistered user.");
            }
          } else {
            console.log('User data retrieved from store.');
            userConnections.set(userMessage, ws);
            flex360Id = userMessage;
            isWaitingForId = false;
            isRegistered = true;
            ws.send("Thank you. Your data has been fetched. How can I assist you today?");
          }
        }
        return;
      }

      if (isAdmin) {
        if (userMessage.startsWith("disconnect:")) {
          const targetFlex360Id = userMessage.split(":")[1];
          if (adminConnections.has(targetFlex360Id)) {
            adminConnections.delete(targetFlex360Id);
            ws.send(`Disconnected from user ${targetFlex360Id}`);
          }
        } else {
          const userWs = userConnections.get(flex360Id);
          if (userWs) {
            userWs.send(`Admin: ${userMessage}`);
            saveMessage(flex360Id, 'admin', userMessage);
          }
        }
      } else {
        if (adminConnections.has(flex360Id)) {
          // If admin is connected, just forward the message to admin
          const adminWs = adminConnections.get(flex360Id);
          if (adminWs) {
            adminWs.send(`User: ${userMessage}`);
          }
          saveMessage(flex360Id, 'user', userMessage);
        } else {
          // If admin is not connected, proceed with bot response
          if (isRegistered) {
            const userData = userDataStore.get(flex360Id);
            if (userData) {
              let context = `User data: ${JSON.stringify(userData)}
User query: ${userMessage}
Please provide a response based on the user's data and query. If the query is about information contained in the user data, use that information in your response. Always refer to the user data when answering questions about the user's details.`;

              console.log('Sending context to OpenAI:', context);

              // Requesting AI response based on user query and context
              const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: "You are a helpful assistant. If user data is available, provide accurate information based on it. For unregistered users, provide general helpful responses.If some ask you name tell them my name is zeptoblink build by sachin" },
                  { role: "user", content: context }
                ],
              });

              const botMessage = response.choices[0].message.content;
              console.log('Received response from OpenAI:', botMessage);
              ws.send(botMessage);

              saveMessage(flex360Id, 'user', userMessage);
              saveMessage(flex360Id, 'bot', botMessage);
            } else {
              ws.send("I'm sorry, I couldn't retrieve your data. Please reconnect and provide your FLEX360_ID again.");
            }
          } else {
            // Handle unregistered user
            let context = `Unregistered user query: ${userMessage}
Please provide a general response to the user's query without referencing any specific user data.`;

            console.log('Sending context to OpenAI:', context);

            // Requesting AI response based on user query and context
            const response = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: "You are a helpful assistant. Provide general helpful responses for unregistered users." },
                { role: "user", content: context }
              ],
            });

            const botMessage = response.choices[0].message.content;
            console.log('Received response from OpenAI:', botMessage);
            ws.send(botMessage);
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send('An error occurred while processing your request.');
    }
  });
});

// Function to fetch old conversations from MongoDB
async function fetchOldConversations(flex360Id) {
  return await Message.find({ flex360Id }).sort({ timestamp: 1 }).exec();
}

app.use(express.static('public'));

// Starting the Express server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Handling WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});