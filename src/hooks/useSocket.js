import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (serverUrl = 'http://localhost:5001') => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [serverUrl]);

  // Function to listen for status updates
  const onStatusUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('statusUpdate', callback);
    }
  };

  // Function to remove status update listener
  const offStatusUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('statusUpdate', callback);
    }
  };

  return {
    socket: socketRef.current,
    onStatusUpdate,
    offStatusUpdate,
  };
};

export default useSocket;
