import jwt from "jsonwebtoken"

import { Request, Response, NextFunction } from "express"

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {

    const token = req.headers["authorization"]?.split(" ")[1]

    if (!token)
        return res.status(401).json({ error: "Toke não fornecido." })

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

        (req as any).user = decoded;

        return next();
    } catch (error) {
        return res.status(403).json({ error: "Token inválido." })
    }
}