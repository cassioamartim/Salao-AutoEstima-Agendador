import { Router } from "express"

import {
    createScheduling,
    getSchedulings,
    getSchedulingById,
    updateScheduling,
    deleteScheduling
} from "../controllers/scheduling.controller";

import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = Router()

// Rotas públicas (requerem apenas autenticação)
router.get('/', authenticate, getSchedulings); // Recolher todos os agendamentos
router.get('/:id', authenticate, getSchedulingById); // Pegar informações de um agendamento específico

// Rotas administrativas (requerem role ADMIN)
router.post('/register', authenticate, requireAdmin, createScheduling); // Criar um novo agendamento
router.put('/:id', authenticate, requireAdmin, updateScheduling); // Atualizar um agendamento existente
router.delete('/:id', authenticate, requireAdmin, deleteScheduling); // Deletar um agendamento existente

export default router;