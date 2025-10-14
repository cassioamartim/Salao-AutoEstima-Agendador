import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { log } from '../services/log.service';

import jwt from 'jsonwebtoken';

class SocketManager {
    private io: SocketIOServer | null = null;

    initialize(server: HTTPServer) {
        const corsOrigins = process.env['FRONTEND_URLS']?.split(',') || ['http://localhost:3000'];
        console.log('🔧 Socket.IO CORS config:', {
            origins: corsOrigins,
            credentials: true,
            methods: ['GET', 'POST']
        });

        this.io = new SocketIOServer(server, {
            cors: {
                origin: corsOrigins,
                methods: ['GET', 'POST'],
                credentials: true,
                allowedHeaders: ['Content-Type', 'Authorization']
            }
        });

        this.io.on('connection', (socket) => {
            log.info('Cliente conectado ao WebSocket', {
                service: 'WEBSOCKET',
                socketId: socket.id,
                userAgent: socket.handshake.headers['user-agent']
            });

            // Autenticação do usuário
            const token = socket.handshake.auth?.['token'] || socket.handshake.query?.['token'];
            let userUuid: string | null = null;

            console.log('🔐 WebSocket auth attempt:', {
                socketId: socket.id,
                hasAuthToken: !!socket.handshake.auth?.['token'],
                hasQueryToken: !!socket.handshake.query?.['token'],
                token: token ? `${token.substring(0, 10)}...` : 'null'
            });

            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env['JWT_SECRET'] || 'fallback-secret') as any;
                    userUuid = decoded.userId;

                    // Adicionar o usuário à sala da conta
                    socket.join(`user:${userUuid}`);
                    log.info('Usuário autenticado e adicionado à sala', {
                        service: 'WEBSOCKET',
                        socketId: socket.id,
                        userUuid: userUuid
                    });
                    console.log('✅ WebSocket autenticado:', { socketId: socket.id, userUuid: userUuid });
                } catch (error) {
                    log.warn('Token inválido no WebSocket', {
                        service: 'WEBSOCKET',
                        socketId: socket.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    console.log('❌ WebSocket auth failed:', { socketId: socket.id, error: error instanceof Error ? error.message : 'Unknown error' });
                }
            } else {
                console.log('❌ WebSocket sem token:', { socketId: socket.id });
            }

            socket.on('disconnect', (reason) => {
                log.info('Cliente desconectado do WebSocket', {
                    service: 'WEBSOCKET',
                    socketId: socket.id,
                    accountId: userUuid,
                    reason
                });
            });
        });
    }

    // Emitir evento para uma sala específica
    emitToRoom(room: string, event: string, data: any) {
        if (!this.io) {
            log.warn('Socket.IO não inicializado', { service: 'WEBSOCKET' });
            return;
        }

        this.io.to(room).emit(event, data);
        log.info('Evento emitido para sala', {
            service: 'WEBSOCKET',
            room,
            event,
            dataKeys: Object.keys(data)
        });
    }
}

export const socketManager = new SocketManager();
