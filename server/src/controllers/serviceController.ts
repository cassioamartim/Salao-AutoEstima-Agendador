import prisma from "../prisma/client";

import { Request, Response } from "express";

export const add = async (req: Request, res: Response) => {

    try {
        const { name, description, base_price, ref_images } = req.body;

        if (!name || !description || !base_price || !ref_images)
            return res.status(400).json({ error: "Dados inválidos." })

        const has = await prisma.service.findUnique({ where: { name } });

        if (has)
            return res.status(400).json({ error: "Um serviço com este nome já existe." })

        const service = await prisma.service.create(
            {
                data: {
                    name,
                    description,
                    base_price,
                    ref_images
                }
            }
        )

        return res.status(200).json({
            message: "Serviço criado.",
            data: {
                uuid: service.uuid,
                name,
                description,
                base_price,
                ref_images
            }
        })

    } catch (error) {
        return res.status(401).json({ error: `Ocorreu um problema ao criar um serviço: ${error}` })
    }
}
