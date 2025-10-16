import { Router } from "express"

import {
    createService,
    getServices,
    getServiceByName,
    updateService,
    deleteService
} from "../controllers/service.controller";

import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = Router()

// Rotas públicas (requerem apenas autenticação)
router.get('/', authenticate, getServices); // Recolher todos os serviços
router.get('/:name', authenticate, getServiceByName); // Pegar informações de um serviço específico

// Rotas administrativas (requerem role ADMIN)
router.post('/register', authenticate, requireAdmin, createService); // Criar um novo serviço
router.put('/:name', authenticate, requireAdmin, updateService); // Atualizar um serviço existente
router.delete('/:name', authenticate, requireAdmin, deleteService); // Deletar um serviço existente

export default router;