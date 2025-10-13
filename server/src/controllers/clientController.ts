import prisma from "../prisma/client";

import { Request, Response } from "express";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {

    try {

        const { name, email, phone, password } = req.body;

        const has = await prisma.client.findUnique({ where: { email } })

        if (has)
            return res.status(400).json({ error: `O email ${email} já está em uso.` })

        const hshPassword = await bcrypt.hash(password, 10);

        const client = await prisma.client.create({
            data: {
                name,
                email,
                phone,
                password: hshPassword
            }
        })

        return res.status(201).json({ client })
    } catch (error) {
        return res.status(500).json({ error: `Erro ao registrar cliente: ${error}` })
    }
}

export const auth = async (req: Request, res: Response) => {

    const { email, password } = req.body;

    const client = await prisma.client.findUnique({ where: { email } })

    if (!client)
        return res.status(401).json({ error: "Email ou senha inválidos." })

    const valid = await bcrypt.compare(password, client.password);

    if (!valid)
        return res.status(401).json({ error: "Senha inválida." })

    const token = jwt.sign({ id: client.id }, process.env.JWT_SECRET as string, { expiresIn: "1d" })

    return res.json({ token, client })
}

export const get = async (req: Request, res: Response) => {

    const { email } = req.body;

    const client = await prisma.client.findUnique({ where: { email } })

    if (!client)
        return res.status(400).json({ error: "Cliente inexistente." })

    return res.json({
        name: client.name,
        email: client.email,
        confirmed_email: client.confirmed_email,
        phone: client.phone,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
    })
}