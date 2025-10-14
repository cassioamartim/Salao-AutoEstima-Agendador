import prisma from "../prisma/client";

import { Request, Response } from "express";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {

    try {

        const { name, email, phone, password, role } = req.body;

        const has = await prisma.user.findUnique({ where: { email } })

        if (has)
            return res.status(400).json({ error: `O email ${email} já está em uso.` })

        const hshPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hshPassword,
                role: role ?? "CLIENT"
            }
        })

        return res.status(201).json({
            data: {
                id: user.id,
                uuid: user.uuid,
                name,
                email,
                phone,
                role: role ?? "CLIENT",
                createdAt: user.createdAt
            }
        })
    } catch (error) {
        return res.status(500).json({ error: `Erro ao registrar usuário: ${error}` })
    }
}

export const auth = async (req: Request, res: Response) => {

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user)
        return res.status(401).json({ error: "Email ou senha inválidos." })

    const valid = await bcrypt.compare(password, user.password);

    if (!valid)
        return res.status(401).json({ error: "Senha inválida." })

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: "1d" })

    return res.json({
        data: {
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            phone: user.phone
        }, token
    })
}

export const get = async (req: Request, res: Response) => {

    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user)
        return res.status(400).json({ error: "Usuário inexistente." })

    return res.json({
        name: user.name,
        email: user.email,
        confirmed_email: user.confirmed_email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    })
}