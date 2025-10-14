import express from "express";
import cors from "cors";

import dotenv from "dotenv";
import http from "http";

import prisma from "./prisma/client";
import cookieParser from "cookie-parser";

import { userRoutes, schedulingRoutes, serviceRoutes } from "./routes/index";

import { log } from "./services/log.service";
import { socketManager } from "./realtime/socket";
import { ensureRedisConnected } from "./cache/redisClient";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Criando servidor HTTP
const httpServer = http.createServer(app);

// Middlewares globais

const rawOrigins = process.env.FRONTEND_URLS || '';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {

        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.length === 0) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log('❌ CORS: Origin blocked:', origin)

        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Initialize WebSocket server (Socket.IO)
socketManager.initialize(httpServer);

// Configurando Express
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser())

// Rotas principais
app.use("/api/users", userRoutes);
app.use("/api/schedulings", schedulingRoutes);
app.use("/api/services", serviceRoutes)

// Erro 404
app.use((req, res) => res.status(404).json({ error: "Rota não encontrada" }));

// Erro global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Erro interno:", err);

    res.status(500).json({
        error: "Erro interno do servidor",
        message: process.env.NODE_ENV === "development" ? err.message : "Algo deu errado",
    });
});

process.on("SIGINT", async () => {
    console.log("\n🛑 Encerrando servidor...");
    await prisma.$disconnect();
    process.exit(0);
});

// Métodos principais
const handleEngine = async (): Promise<void> => {
    try {

        // Teste de conexão com o banco de dados
        await prisma.$connect();

        log.success('MySQL conectado com sucesso!', { service: 'DB' })

        // Log de configurações da conexão
        const databaseUrl = process.env['DATABASE_URL'];
        const host = databaseUrl?.match(/@([^:]+):/)?.[1] || 'unknown';

        log.info(`Conexão efetuada em: ${host}`, { service: 'DB' })

        // Initialize Redis connection (non-blocking for startup logs)
        ensureRedisConnected()
            .then(() => log.success('Redis conectado com sucesso!', { service: 'CACHE' }))
            .catch((err) => log.warn('Redis não conectado no início', { service: 'CACHE', error: err?.message || err }));

        httpServer.listen(PORT, () => {
            log.success(`Servidor rodando na porta ${PORT}`, { service: 'SYSTEM' });
            log.info(`Endpoint de usuários: ${process.env['PUBLIC_API_URL']}/users`, { service: 'SERVER' });
        });
    } catch (err) {
        log.error('Ocorreu um erro ao iniciar o sistema', err as Error, { service: 'SYSTEM' });

        process.exit(1);
    }
}

handleEngine();