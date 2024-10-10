# Zepto Blink - WebSocket-Based Chatbot

Zepto Blink is a powerful chatbot built using WebSocket functionality to serve both guest and registered users. It allows seamless communication between users, bots, and admins.

![Interface](Images/Screenshot%20(850).png)

## Features

### 1. Guest User Interaction
- If the user is not registered, they can interact with the bot as a guest. The bot will reply to general queries and provide basic assistance.
  
  ![Guest User Interaction](Images/Screenshot%20(851).png)

### 2. Registered User Interaction
- Registered users are prompted to provide their user ID.
- The bot fetches and displays user information based on API data.
- Users can ask questions like "Tell my registration date," and the bot will retrieve and display the relevant details.
  
  ![Registered User Interaction](Images/Screenshot%20(852).png)

### 3. Admin User Connection
- Admins can directly connect with users by providing the user ID.
- The bot will disconnect, allowing the admin and user to communicate freely.
- Admins can also see the past chat history between the user and the bot.
- Once the admin disconnects, the user is reconnected with the bot.

  ![Admin User Connection](Images/Screenshot%20(853).png)

### 4. Chat History
- Admins can view the past interactions between the bot and users to provide better assistance and manage user requests efficiently.
  
  ![Chat History](Images/Screenshot%20(853).png)

### 5. Admin Rights
- Admins have the authority to disconnect from the user at any time, after which the user will automatically reconnect with the bot for further queries.
  
  ![Admin Disconnect](Images/Screenshot%20(854).png)

## How It Works
- **Guest User**: The bot handles basic queries.
- **Registered User**: After authenticating with a user ID, the bot fetches data through API calls and answers user-specific questions.
- **Admin**: Admins can interact with users, view past chats, and disconnect to revert control back to the bot.

## Technologies Used
- WebSocket
- API Integration
- User/Session Management


## Demo Video
Watch the demo of Zepto Blink in action:

[Click here to watch the video](Images/Demo.mp4)
