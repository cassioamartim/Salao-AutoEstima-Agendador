import { Router } from "express";

import { register, auth, get } from "../controllers/userController"

const router = Router();

router.get("/", get)
router.post('/register', register)
router.post('/auth', auth)

export default router;