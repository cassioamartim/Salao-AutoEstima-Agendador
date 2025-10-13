import { Router } from "express";

import { add } from "../controllers/schedulingController"

const router = Router();

router.post("/add", add)

export default router;