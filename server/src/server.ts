import express from "express";
import cors from "cors";

import dotenv from "dotenv";
import prisma from "./prisma/client";

import { clientRoutes, schedulingRoutes, serviceRoutes } from "./routes/index";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rotas principais
app.use("/api/clients", clientRoutes);
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

app.listen(PORT, () => {
    console.log("💆‍♀️ Agendamento virtual Salão Autoestima.");
    console.log("📊 Servidor rodando na porta", PORT);
});

process.on("SIGINT", async () => {
    console.log("\n🛑 Encerrando servidor...");
    await prisma.$disconnect();
    process.exit(0);
});
