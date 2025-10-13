import prisma from "../prisma/client"

import { Request, Response } from "express"

export const add = async (req: Request, res: Response) => {

    try {

        const { clientUuid, serviceUuid, date } = req.body;

        if (!clientUuid || !serviceUuid || !date)
            return res.status(400).json({ error: "Dados incompletos." });

        const clientExists = await prisma.client.findUnique({ where: { uuid: clientUuid } });
        const serviceExists = await prisma.service.findUnique({ where: { uuid: serviceUuid } });

        if (!clientExists || !serviceExists)
            return res.status(404).json({ error: "Cliente ou serviço não encontrado." });

        const scheduling = await prisma.scheduling.create({
            data: {
                client: { connect: { uuid: clientUuid } },
                service: { connect: { uuid: serviceUuid } },
                date,
            },
            include: { client: true, service: true }
        });

        return res.status(201).json({ message: "Agendamento criado com sucesso.", scheduling });
    } catch (error) {
        return res.status(500).json({ error: `Erro ao adicionar um agendamento: ${error}` })
    }
}