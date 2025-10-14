import jwt from "jsonwebtoken"

import { Request, Response, NextFunction } from "express"

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {

    const header = req.headers["authorization"];
    const token = header && header.split(' ')[1];

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Token de acesso obrigatório."
        })
        return;
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        req.user = decoded;

        next();

        return;
    } catch (error) {
        res.status(403).json({
            success: false,
            error: "Token inválido ou expirado."
        })

        return;
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {

    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Autenticação necessária."
        });

        return;
    }

    if (req.user.role !== 'ADMIN') {
        res.status(403).json({
            success: false,
            message: "Acesso de administração necessário."
        });

        return;
    }

    next();
    return;
};

interface JwtPayload {
    uuid: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}