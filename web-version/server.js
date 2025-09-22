const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Web version running at: http://localhost:${PORT}`);
    console.log('📱 Open this URL in Chrome, Edge, or Firefox for best screen sharing support');
    console.log('🔗 Share this URL with others to test together');
});





