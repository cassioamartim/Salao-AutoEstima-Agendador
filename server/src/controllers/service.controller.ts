import prisma from "../prisma/client";

import { Request, Response } from "express";
import { log } from "../services/log.service";

import {
    CreateServiceData,
    UpdateServiceData
} from "../models/service.model";

import { getOrSetCache, CacheKeys, CacheTags } from "../cache/cache";

export const createService = async (req: Request, res: Response): Promise<void> => {

    try {

        log.info('Criando serviço', { service: 'SERVICE', method: 'CREATING_SERVICE', data: req.body });

        const { name, description, base_price, ref_images }: CreateServiceData = req.body;

        if (!name || !description || !base_price || !ref_images) {

            res.status(400).json({
                success: false,
                message: 'Nome, descrição, preço & imagens de referências são obrigatórios.'
            });

            return;
        }

        const existingService = await prisma.service.findUnique({
            where: { name }
        });

        if (existingService) {

            res.status(409).json({
                success: false,
                message: `Serviço ${name} já foi cadastrado.`
            });

            return;
        }

        const creatingService = await prisma.service.create({
            data: {
                name,
                description,
                base_price,
                ref_images
            } as any
        });

        log.success('Serviço criado com sucesso', {
            service: 'SERVICE',
            method: 'CREATED_SERVICE',
            userId: creatingService.uuid,
            id: creatingService.id,
            name: creatingService.name,
            description: creatingService.description,
            base_price: creatingService.base_price,
            ref_images: creatingService.ref_images,
            createdAt: creatingService.createdAt,
            updatedAt: creatingService.updatedAt
        });

        res.status(201).json({
            success: true,
            message: 'Serviço criado com sucesso.'
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao registrar um serviço:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}

export const getServices = async (_req: Request, res: Response): Promise<void> => {

    try {

        const services = await getOrSetCache(
            CacheKeys.servicesList,
            async () =>
                prisma.service.findMany({
                    select: {
                        id: true,
                        uuid: true,
                        name: true,
                        description: true,
                        base_price: true,
                        ref_images: true,
                        createdAt: true,
                        updatedAt: true
                    } as any,
                }),
            { tag: CacheTags.services, ttlSeconds: 120 }
        );

        res.status(200).json({
            success: true,
            message: 'Serviços recolhidos.',
            data: services
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro na busca de serviços:', err)

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
};

export const getServiceByName = async (req: Request, res: Response): Promise<void> => {

    try {
        const { name } = req.params;

        if (!name) {
            res.status(400).json({
                success: false,
                message: "O nome do serviço é obrigatório."
            });
            return;
        }

        const service = await prisma.service.findUnique({
            where: { name },
            select: {
                id: true,
                uuid: true,
                name: true,
                description: true,
                base_price: true,
                ref_images: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!service) {
            res.status(404).json({
                success: false,
                message: "Serviço não encontrado."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Dados do serviço coletados.",
            data: service
        });

        return;
    } catch (err) {
        console.error('Ocorreu um erro ao buscar um serviço:', err)

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });

        return;
    }
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.params;
        const updateData: UpdateServiceData = req.body;

        if (!name) {
            res.status(400).json({
                success: false,
                message: "O nome do serviço é obrigatório."
            });
            return;
        }

        const existingService = await prisma.service.findUnique({
            where: { name }
        });

        if (!existingService) {
            res.status(404).json({
                success: false,
                message: 'Serviço não encontrado.'
            });

            return;
        }

        if (updateData.name && updateData.name !== existingService.name) {
            const nameExists = await prisma.service.findUnique({
                where: { name: updateData.name }
            });

            if (nameExists) {
                res.status(409).json({
                    success: false,
                    message: 'Um serviço com esse nome já está cadastrado.'
                });

                return;
            }
        }

        const blockFields = ["id", "uuid"];
        const safeData = Object.fromEntries(
            Object.entries(updateData)
                .filter(([key]) => !blockFields.includes(key))
        );

        const updatedService = await prisma.service.update({
            where: { name },
            data: safeData,
            select: {
                id: true,
                uuid: true,
                name: true,
                description: true,
                base_price: true,
                ref_images: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Serviço atualizado com sucesso',
            data: updatedService
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao atualizar um serviço:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}

export const deleteService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.params;

        if (!name) {
            res.status(400).json({
                success: false,
                message: "O nome do serviço é obrigatório."
            });
            return;
        }

        const existingService = await prisma.service.findUnique({
            where: { name }
        });

        if (!existingService) {
            res.status(404).json({
                success: false,
                message: 'Serviço não encontrado'
            });

            return;
        }

        await prisma.service.delete({
            where: { name }
        });

        res.status(200).json({
            success: true,
            message: 'Serviço deletado com sucesso'
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao deletar um serviço:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}