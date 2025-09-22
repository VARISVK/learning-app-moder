// WebRTC functionality for screen sharing
class WebRTCManager {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.isSharing = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPeerConnection();
    }

    setupEventListeners() {
        // Screen share modal controls
        document.getElementById('start-screen-share')?.addEventListener('click', () => {
            this.startScreenShare();
        });

        document.getElementById('stop-screen-share')?.addEventListener('click', () => {
            this.stopScreenShare();
        });

        document.getElementById('close-share-modal')?.addEventListener('click', () => {
            this.closeScreenShareModal();
        });

        document.getElementById('test-screen-share')?.addEventListener('click', () => {
            this.testScreenShare();
        });

        document.getElementById('start-camera-share')?.addEventListener('click', () => {
            this.startCameraShare();
        });

        // Close modal on backdrop click
        document.getElementById('screen-share-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'screen-share-modal') {
                this.closeScreenShareModal();
            }
        });
    }

    setupPeerConnection() {
        // Configure ICE servers for WebRTC
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('Received remote stream');
            this.remoteStream = event.streams[0];
            this.displayRemoteStream();
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate to remote peer
                this.sendIceCandidate(event.candidate);
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            this.updateConnectionStatus(this.peerConnection.connectionState);
        };
    }

    async startScreenShare() {
        try {
            console.log('Starting screen share...');
            
            // Check if we're in Electron
            if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
                console.log('Running in Electron renderer process');
            }

            // Check if getDisplayMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('Screen sharing not supported in this browser');
            }

            // Request screen capture with minimal options first
            const constraints = {
                video: {
                    cursor: 'always'
                },
                audio: false
            };

            console.log('Requesting screen capture with constraints:', constraints);
            
            this.localStream = await navigator.mediaDevices.getDisplayMedia(constraints);

            console.log('Screen capture started successfully');
            console.log('Stream tracks:', this.localStream.getTracks().map(track => ({
                kind: track.kind,
                enabled: track.enabled,
                readyState: track.readyState
            })));

            // Display local stream
            this.displayLocalStream();

            // Add stream to peer connection
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            // Handle stream end (user stops sharing)
            this.localStream.getVideoTracks()[0].onended = () => {
                console.log('Screen sharing ended by user');
                this.stopScreenShare();
            };

            this.isSharing = true;
            this.updateShareControls();

            // Create offer and send to remote peer
            await this.createOffer();

            console.log('Screen sharing setup complete');

        } catch (error) {
            console.error('Error starting screen share:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Provide more specific error messages
            let errorMessage = 'Failed to start screen sharing. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Permission denied. Please allow screen sharing when prompted.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No screen source found. Please try again.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += 'Screen sharing not supported. Please use Chrome, Edge, or Firefox.';
            } else if (error.name === 'AbortError') {
                errorMessage += 'Screen sharing was cancelled.';
            } else {
                errorMessage += `Error: ${error.message}`;
            }
            
            this.showError(errorMessage);
        }
    }

    async stopScreenShare() {
        try {
            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }

            // Close peer connection
            if (this.peerConnection) {
                this.peerConnection.close();
                this.setupPeerConnection(); // Reset for next session
            }

            // Clear video elements
            this.clearVideoElements();

            this.isSharing = false;
            this.updateShareControls();

        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    }

    displayLocalStream() {
        const localVideo = document.getElementById('local-video');
        if (localVideo && this.localStream) {
            localVideo.srcObject = this.localStream;
        }
    }

    displayRemoteStream() {
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo && this.remoteStream) {
            remoteVideo.srcObject = this.remoteStream;
        }
    }

    clearVideoElements() {
        const localVideo = document.getElementById('local-video');
        const remoteVideo = document.getElementById('remote-video');
        
        if (localVideo) {
            localVideo.srcObject = null;
        }
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }
    }

    updateShareControls() {
        const startBtn = document.getElementById('start-screen-share');
        const stopBtn = document.getElementById('stop-screen-share');

        if (startBtn && stopBtn) {
            startBtn.disabled = this.isSharing;
            stopBtn.disabled = !this.isSharing;
        }
    }

    updateConnectionStatus(status) {
        // Update UI based on connection status
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = `Connection: ${status}`;
        }
    }

    async createOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            // Send offer to remote peer (via WebSocket in real implementation)
            this.sendOffer(offer);
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }

    async handleOffer(offer) {
        try {
            await this.peerConnection.setRemoteDescription(offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            // Send answer to remote peer
            this.sendAnswer(answer);
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(answer) {
        try {
            await this.peerConnection.setRemoteDescription(answer);
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async handleIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    // These methods would send data via WebSocket in a real implementation
    sendOffer(offer) {
        console.log('Sending offer:', offer);
        // In real implementation: socket.emit('offer', offer);
    }

    sendAnswer(answer) {
        console.log('Sending answer:', answer);
        // In real implementation: socket.emit('answer', answer);
    }

    sendIceCandidate(candidate) {
        console.log('Sending ICE candidate:', candidate);
        // In real implementation: socket.emit('ice-candidate', candidate);
    }

    closeScreenShareModal() {
        const modal = document.getElementById('screen-share-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.stopScreenShare();
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff4444;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-weight: 600;
            z-index: 1001;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Method to start a session with a specific user
    startSession(userId, userName) {
        console.log(`Starting WebRTC session with ${userName} (ID: ${userId})`);
        // In a real implementation, this would:
        // 1. Send a connection request via WebSocket
        // 2. Wait for acceptance
        // 3. Exchange signaling data
        // 4. Establish peer connection
    }

    // Test method to check screen sharing capabilities
    async testScreenShare() {
        try {
            console.log('Testing screen share capabilities...');
            console.log('Navigator:', navigator);
            console.log('MediaDevices:', navigator.mediaDevices);
            console.log('getDisplayMedia available:', !!navigator.mediaDevices?.getDisplayMedia);
            
            // Check if we're in Electron
            if (typeof window !== 'undefined' && window.process) {
                console.log('Running in Electron environment');
            }
            
            // Check if getDisplayMedia is available
            if (!navigator.mediaDevices) {
                this.showError('MediaDevices API not available. This might be a security restriction.');
                return;
            }
            
            if (!navigator.mediaDevices.getDisplayMedia) {
                this.showError('Screen sharing API not available. This feature requires a modern browser.');
                return;
            }

            // Test screen capture with very basic constraints
            console.log('Attempting to get display media...');
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });

            console.log('Screen sharing test successful!');
            console.log('Test stream tracks:', stream.getTracks().length);
            console.log('Stream details:', {
                id: stream.id,
                active: stream.active,
                tracks: stream.getTracks().map(t => ({
                    kind: t.kind,
                    enabled: t.enabled,
                    readyState: t.readyState
                }))
            });
            
            this.showSuccess('Screen sharing test successful! You can now use the main screen share button.');
            
            // Stop the test stream
            stream.getTracks().forEach(track => track.stop());

        } catch (error) {
            console.error('Screen sharing test failed:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            let errorMsg = 'Screen sharing test failed: ';
            if (error.name === 'NotAllowedError') {
                errorMsg += 'Permission denied. Please allow screen sharing when prompted.';
            } else if (error.name === 'NotFoundError') {
                errorMsg += 'No screen source found.';
            } else if (error.name === 'NotSupportedError') {
                errorMsg += 'Screen sharing not supported in this environment.';
            } else {
                errorMsg += error.message;
            }
            
            this.showError(errorMsg);
        }
    }

    // Alternative method using getUserMedia as fallback
    async startCameraShare() {
        try {
            console.log('Starting camera share as fallback...');
            
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showError('Camera access not available. Please check browser permissions.');
                return;
            }
            
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            console.log('Camera capture started successfully');
            console.log('Camera stream tracks:', this.localStream.getTracks().length);
            this.displayLocalStream();
            this.isSharing = true;
            this.updateShareControls();

        } catch (error) {
            console.error('Error starting camera share:', error);
            this.showError('Failed to start camera share. Please check camera permissions.');
        }
    }

    // Simple test to check if we can access any media
    async testMediaAccess() {
        try {
            console.log('Testing basic media access...');
            
            if (!navigator.mediaDevices) {
                this.showError('MediaDevices API not available');
                return false;
            }
            
            // Test getUserMedia first (usually more permissive)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            
            console.log('Basic media access works!');
            stream.getTracks().forEach(track => track.stop());
            return true;
            
        } catch (error) {
            console.error('Basic media access failed:', error);
            this.showError('Media access not available. Please check browser permissions.');
            return false;
        }
    }

    showSuccess(message) {
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            background-color: #00ff88;
            color: #000000;
            font-weight: 600;
            z-index: 1001;
            max-width: 300px;
            word-wrap: break-word;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            successDiv.style.opacity = '0';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize WebRTC manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.webrtcManager = new WebRTCManager();
});
