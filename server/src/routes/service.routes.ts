import { Router } from "express"

import {
    createService,
    getServices,
    getServiceByName,
    updateService,
    deleteService
} from "../controllers/service.controller";

import { requireAdmin } from "../middleware/auth.middleware";

const router = Router()

// Rotas
router.post('/register', requireAdmin, createService); // Criar um novo serviço
router.put('/:name', requireAdmin, updateService); // Atualizar um serviço existente

router.get('/', requireAdmin, getServices); // Recolher todos os serviços
router.get('/:name', requireAdmin, getServiceByName); // Pegar informações de um serviço específico

router.delete('/:name', requireAdmin, deleteService); // Deletar um serviço existente

export default router;