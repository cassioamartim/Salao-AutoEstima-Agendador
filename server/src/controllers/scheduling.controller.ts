import prisma from "../prisma/client";

import { Request, Response } from "express";
import { log } from "../services/log.service";

import {
    CreateSchedulingData,
    UpdateSchedulingData
} from "../models/scheduling.model";

import { getOrSetCache, CacheKeys, CacheTags } from "../cache/cache";

export const createScheduling = async (req: Request, res: Response): Promise<void> => {

    try {

        log.info('Criando agendamento', { service: 'SCHEDULING', method: 'CREATING_SCHEDULING', data: req.body });

        const { userUuid, serviceUuid, date }: CreateSchedulingData = req.body;

        if (!userUuid || !serviceUuid || !date) {

            res.status(400).json({
                success: false,
                message: 'UUID de usuário, UUID de serviço & Data são obrigatórios.'
            });

            return;
        }

        const creatingScheduling = await prisma.scheduling.create({
            data: {
                userUuid,
                serviceUuid,
                date
            } as any
        });

        log.success('Agendamento criado com sucesso', {
            service: 'SCHEDULING',
            method: 'CREATED_SCHEDULING',
            userId: creatingScheduling.uuid,
            id: creatingScheduling.id,
            userUuid: creatingScheduling.userUuid,
            serviceUuid: creatingScheduling.serviceUuid,
            date: creatingScheduling.date,
            createdAt: creatingScheduling.createdAt,
            updatedAt: creatingScheduling.updatedAt
        });

        res.status(201).json({
            success: true,
            message: 'Agendamento criado com sucesso.'
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao registrar um agendamento:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}

export const getSchedulings = async (req: Request, res: Response): Promise<void> => {

    try {

        const isAdmin = req.user?.role === 'ADMIN'

        const schedulings = await prisma.scheduling.findMany({
            where: isAdmin ? {} : { userUuid: req.user?.uuid },
            select: {
                id: true,
                uuid: true,
                userUuid: true,
                serviceUuid: true,
                date: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: { uuid: true, name: true, email: true }
                },
                service: {
                    select: { uuid: true, name: true, description: true, base_price: true }
                }
            } as any
        });

        res.status(200).json({
            success: true,
            message: 'Agendamentos recolhidos.',
            data: schedulings
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro na busca de agendamentos:', err)

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
};

export const getSchedulingById = async (req: Request, res: Response): Promise<void> => {

    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "O ID de agendamento é obrigatório."
            });
            return;
        }

        const realId = Number(id);

        if (isNaN(realId)) {

            res.status(400).json({
                success: false,
                message: 'O ID informado é inválido.'
            });

            return;
        }

        const schedulings = await prisma.scheduling.findUnique({
            where: { id: realId },
            select: {
                id: true,
                uuid: true,
                userUuid: true,
                serviceUuid: true,
                date: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                user: { select: { uuid: true, name: true, email: true } },
                service: { select: { uuid: true, name: true, description: true, base_price: true } }
            }
        });

        if (!schedulings) {
            res.status(404).json({
                success: false,
                message: "Agendamento não encontrado."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Dados do agendamento coletados.",
            data: schedulings
        });

        return;
    } catch (err) {
        console.error('Ocorreu um erro ao buscar um agendamento:', err)

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });

        return;
    }
};

export const updateScheduling = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const updateData: UpdateSchedulingData = req.body;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "O ID do agendamento é obrigatório."
            });
            return;
        }

        const realId = Number(id);

        if (isNaN(realId)) {

            res.status(400).json({
                success: false,
                message: 'O ID informado é inválido.'
            });

            return;
        }

        const existingScheduling = await prisma.scheduling.findUnique({
            where: { id: realId }
        });

        if (!existingScheduling) {
            res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado.'
            });

            return;
        }

        const blockFields = ["id", "uuid"];

        const safeData = Object.fromEntries(
            Object.entries(updateData)
                .filter(([key]) => !blockFields.includes(key))
        );

        const updatedService = await prisma.scheduling.update({
            where: { id: realId },
            data: safeData,
            select: {
                id: true,
                uuid: true,
                userUuid: true,
                serviceUuid: true,
                date: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Agendamento atualizado com sucesso',
            data: updatedService
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao atualizar um agendamento:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}

export const deleteScheduling = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "O ID do agendamento é obrigatório."
            });
            return;
        }

        const realId = Number(id);

        if (isNaN(realId)) {

            res.status(400).json({
                success: false,
                message: 'O ID informado é inválido.'
            });

            return;
        }

        const existingScheduling = await prisma.scheduling.findUnique({
            where: { id: realId },
            select: { id: true, userUuid: true }
        });

        if (!existingScheduling) {
            res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });

            return;
        }

        const isAdmin = req.user?.role === 'ADMIN'

        // Only owner or admin can delete
        if (!isAdmin && existingScheduling.userUuid !== req.user?.uuid) {
            res.status(403).json({ success: false, message: 'Sem permissão para cancelar este agendamento.' })
            return;
        }

        await prisma.scheduling.delete({
            where: { id: realId }
        });

        res.status(200).json({
            success: true,
            message: 'Agendamento deletado com sucesso'
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao deletar um agendamento:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}