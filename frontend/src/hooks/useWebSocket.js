import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { safeStorage } from '../utils/safeStorage';


/**
 * Generic WebSocket hook to subscribe to a specific topic.
 * @param {string} topic - The STOMP topic to subscribe to (e.g., '/topic/project.123')
 * @param {function} onMessage - Callback when a message is received
 */
export const useWebSocket = (topic, onMessage) => {
    const clientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    // Get token from localStorage since AuthContext doesn't expose it directly yet
    const token = safeStorage.getItem('accessToken');

    useEffect(() => {
        return; // WebSocket Disabled
        if (!topic || !token) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`http://${window.location.hostname}:8080/ws`), // Use SockJS
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log(`WebSocket Connected to ${topic}`);
                setIsConnected(true);

                client.subscribe(topic, (message) => {
                    if (message.body) {
                        try {
                            const parsed = JSON.parse(message.body);
                            onMessage(parsed);
                        } catch (e) {
                            console.error('Failed to parse WebSocket message', e);
                        }
                    }
                });
            },
            onDisconnect: () => {
                console.log('WebSocket Disconnected');
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [topic, token, onMessage]); // Add token to dependency array

    return { isConnected };
};
