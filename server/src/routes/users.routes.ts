import { Router } from "express";

import {
    createUser,
    authUser,
    getUsers,
    getUserByUuid,
    updateUser,
    deleteUser
} from "../controllers/user.controller";

import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Rotas públicas
router.post('/register', createUser);
router.post('/login', authUser);

// Rotas privadas
router.get('/', authenticate, requireAdmin, getUsers); // Busca os dados de todos os usuários do banco de dados
router.get('/:id', authenticate, getUserByUuid); // Busca os dados de um usuário específico

router.put('/:id', authenticate, updateUser); // Atualizar dados de um usuário 
router.delete('/:id', authenticate, requireAdmin, deleteUser); // Deletar um usuário

export default router;