import { Router } from "express"

import {
    createScheduling,
    getSchedulings,
    getSchedulingById,
    updateScheduling,
    deleteScheduling
} from "../controllers/scheduling.controller";

import { requireAdmin } from "../middleware/auth.middleware";

const router = Router()

// Rotas
router.post('/register', requireAdmin, createScheduling); // Criar um novo agendamento
router.put('/:id', requireAdmin, updateScheduling); // Atualizar um agendamento existente

router.get('/', requireAdmin, getSchedulings); // Recolher todos os agendamentos
router.get('/:id', requireAdmin, getSchedulingById); // Pegar informações de um agendamento específico

router.delete('/:id', requireAdmin, deleteScheduling); // Deletar um agendamento existente

export default router;