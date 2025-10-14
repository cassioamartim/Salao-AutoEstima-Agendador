import prisma from "../prisma/client"

import { Request, Response } from "express"

export const add = async (req: Request, res: Response) => {

    try {

        const { userUuid, serviceUuid, date } = req.body;

        if (!userUuid || !serviceUuid || !date)
            return res.status(400).json({ error: "Dados incompletos." });

        const userExists = await prisma.user.findUnique({ where: { uuid: userUuid } });
        const serviceExists = await prisma.service.findUnique({ where: { uuid: serviceUuid } });

        if (!userExists || !serviceExists)
            return res.status(404).json({ error: "Usuário ou serviço não encontrado." });

        const scheduling = await prisma.scheduling.create({
            data: {
                user: { connect: { uuid: userUuid } },
                service: { connect: { uuid: serviceUuid } },
                date,
            },
            include: { user: true, service: true }
        });

        return res.status(201).json({ message: "Agendamento criado com sucesso.", scheduling });
    } catch (error) {
        return res.status(500).json({ error: `Erro ao adicionar um agendamento: ${error}` })
    }
}