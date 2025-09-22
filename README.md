# EdTech Learning Platform

A professional Electron.js application for connecting students and enabling collaborative learning through screen sharing and study partner matching.

## Features

- **User Authentication**: Secure login/register system with SQLite database
- **Professional UI**: Clean black theme with green accents
- **Study Partner Matching**: Find and connect with other online students
- **Screen Sharing**: WebRTC-powered real-time screen sharing
- **Wallet System**: Recharge and manage virtual wallet
- **Real-time Updates**: WebSocket-based online status management

## Technology Stack

- **Frontend**: Electron.js, HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: SQLite3
- **Real-time**: WebRTC, WebSockets
- **Security**: bcryptjs for password hashing

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learning-app-mode
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create data directory**
   ```bash
   mkdir data
   ```

## Running the Application

### Development Mode

1. **Start the WebSocket server** (in one terminal):
   ```bash
   npm run server
   ```

2. **Start the Electron app** (in another terminal):
   ```bash
   npm run dev
   ```

### Production Mode

1. **Start the server**:
   ```bash
   npm run server
   ```

2. **Start the app**:
   ```bash
   npm start
   ```

## Project Structure

```
learning-app-mode/
├── main.js                 # Electron main process
├── package.json            # Dependencies and scripts
├── data/                   # SQLite database storage
├── src/
│   ├── index.html         # Main HTML file
│   ├── styles/            # CSS files
│   │   ├── main.css       # Base styles
│   │   ├── auth.css       # Authentication styles
│   │   ├── dashboard.css  # Dashboard styles
│   │   ├── study-partner.css # Study partner styles
│   │   └── wallet.css     # Wallet styles
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Main app controller
│   │   ├── auth.js        # Authentication logic
│   │   ├── dashboard.js   # Dashboard functionality
│   │   ├── study-partner.js # Study partner features
│   │   ├── wallet.js      # Wallet management
│   │   └── webrtc.js      # WebRTC screen sharing
│   └── database/
│       └── database.js    # SQLite database operations
└── server/
    └── server.js          # WebSocket server
```

## Usage

### First Time Setup

1. **Register a new account**:
   - Enter username, email, full name, and password
   - Click "Register"
   - You'll be redirected to login

2. **Login**:
   - Use your registered credentials
   - You'll be taken to the dashboard

### Using the Application

1. **Dashboard**: View your stats and navigate to different sections
2. **Find Study Partner**: Browse online students and connect with them
3. **Screen Sharing**: Start collaborative sessions with other users
4. **Wallet**: Recharge your virtual wallet for premium features

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts and profiles
- **study_sessions**: Study session records
- **wallet_transactions**: Wallet transaction history

## WebSocket Events

The server handles these WebSocket events:

- `user-login`: User comes online
- `user-logout`: User goes offline
- `connection-request`: Request to connect with another user
- `connection-response`: Response to connection request
- `webrtc-offer`: WebRTC offer for screen sharing
- `webrtc-answer`: WebRTC answer
- `webrtc-ice-candidate`: ICE candidate exchange

## Development Notes

### Testing with Multiple Devices

For testing with 2 laptops:

1. **Laptop 1**: Run the server and app
2. **Laptop 2**: 
   - Install the app
   - Modify the WebSocket connection URL in the code to point to Laptop 1's IP
   - Run the app

### WebRTC Configuration

The WebRTC implementation uses:
- STUN servers for NAT traversal
- Screen capture API for sharing
- Peer-to-peer connections for real-time communication

### Security Considerations

- Passwords are hashed using bcryptjs
- Input validation on all forms
- SQL injection protection through parameterized queries
- CORS enabled for development

## Building for Production

```bash
npm run build
```

This will create a distributable package in the `dist/` directory.

## Troubleshooting

### Common Issues

1. **Database errors**: Ensure the `data/` directory exists and is writable
2. **WebSocket connection failed**: Check if the server is running on port 3001
3. **Screen sharing not working**: Ensure HTTPS or localhost for WebRTC
4. **Build errors**: Clear node_modules and reinstall dependencies

### Logs

- Electron logs: Check the developer console (F12)
- Server logs: Check the terminal where the server is running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.



