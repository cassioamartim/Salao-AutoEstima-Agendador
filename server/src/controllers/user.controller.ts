import prisma from "../prisma/client";

import { Request, Response } from "express";
import { log } from "../services/log.service";
import { getOrSetCache, CacheKeys, CacheTags, invalidateByTag } from "../cache/cache";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Models
import {
    UserData,
    CreateUserData,
    UpdateUserData,
    AuthPayload,
    AuthData
} from "../models/user.model";

// Métodos utilitários
const generateCryptPassword = async (password: string): Promise<string> => {
    const rounds = 10;

    return bcrypt.hash(password, rounds);
};

const samePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

const generateJWTToken = (uuid: string, email: string, role: string): string => {
    return jwt.sign(
        { uuid, email, role },
        process.env['JWT_SECRET']!,
        { expiresIn: '24h' }
    );
};

const getClientAddress = (req: Request): string => {
    return (req.headers['x-forwarded-for'] as string)
        || (req.headers['x-real-ip'] as string)
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || 'unknown';
}

const getUTMParams = (req: Request) => {

    log.debug('Todos os cookies recebidos', { service: 'UTM', cookies: req.cookies })

    const params = {
        utm_source: req.cookies['utm_source'],
        utm_campaign: req.cookies['utm_campaign'],
        utm_medium: req.cookies['utm_medium'],
        utm_content: req.cookies['utm_content'],
        utm_term: req.cookies['utm_term']
    };

    log.debug('Parâmetros de UTM extraidos', { service: 'UTM', params });

    return params;
}

const getTagParams = (req: Request) => {
    const params = {
        tag: req.cookies['tag']
    };

    log.debug('Parâmetros de Tag extraidos', { service: 'UTM', params })

    return params;
}

const getTrackingParams = (req: Request) => {
    return {
        ...getUTMParams(req),
        ...getTagParams(req)
    };
}

const formatUserData = (user: any): UserData => {
    return {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        confirmed_email: user.confirmed_email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

export const createUser = async (req: Request, res: Response): Promise<void> => {

    try {

        log.info('Criando usuário', { service: 'AUTH', method: 'CREATE_USER', data: req.body });

        const { name, email, phone, password, role = 'CLIENT' }: CreateUserData = req.body;

        const userRole = role as 'CLIENT' | 'ADMIN';

        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'E-mail, nome & senha são obrigatórios.'
            });

            return;
        }

        log.debug('Verificando se o e-mail existe', { service: 'AUTH', method: 'CHECK_EMAIL', email });

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'E-mail já cadastrado.'
            })

            return;
        }

        log.debug('Convertendo senha para BCrypt', { service: 'AUTH', method: 'HASH_PASSWORD' });

        const hashedPassword = await generateCryptPassword(password);

        log.debug('Obtendo parâmetros de rastreio a partir dos cookies', { service: 'UTM', method: 'EXTRACT_COOKIES' });

        const trackingParams = getTrackingParams(req);

        const { utm_source, utm_campaign, utm_medium, utm_content, utm_term } = req.body;

        const finalUTMParams = {
            utm_source: trackingParams['utm_source'] || utm_source || null,
            utm_campaign: trackingParams['utm_campaign'] || utm_campaign || null,
            utm_medium: trackingParams['utm_medium'] || utm_medium || null,
            utm_content: trackingParams['utm_content'] || utm_content || null,
            utm_term: trackingParams['utm_term'] || utm_term || null
        };

        log.info('Parâmetros UTM finais para a criação do usuário', { service: 'UTM', method: 'FINAL_PARAMS', utmParams: finalUTMParams });

        log.debug('Obtendo IP do cliente', { service: 'AUTH', method: 'GET_IP' })

        const ipAddress = getClientAddress(req);

        // Criando usuário
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: userRole,
                utm_source: finalUTMParams.utm_source,
                utm_campaign: finalUTMParams.utm_campaign,
                utm_medium: finalUTMParams.utm_medium,
                utm_content: finalUTMParams.utm_content,
                utm_term: finalUTMParams.utm_term,
                tag: trackingParams['tag'] || null,
                ip_address: ipAddress
            } as any
        });

        log.success('Usuário criado com dados de rastreamento', {
            service: 'AUTH',
            method: 'USER_CREATED',
            userId: user.uuid,
            email: user.email,
            utm_source: finalUTMParams.utm_source,
            utm_campaign: finalUTMParams.utm_campaign,
            utm_medium: finalUTMParams.utm_medium,
            utm_content: finalUTMParams.utm_content,
            utm_term: finalUTMParams.utm_term,
            tag: trackingParams.tag,
            ip_address: ipAddress
        });

        const userData = formatUserData(user);

        // Gerar token para login automático
        const token = generateJWTToken(user.uuid, user.email, user.role);

        const authData: AuthData = {
            user: userData,
            token
        };

        await invalidateByTag(CacheTags.users);

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso.',
            data: authData
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao criar um usuário:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
};

export const authUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: AuthPayload = req.body;

        if (!email || !password) {

            res.status(400).json({
                success: false,
                message: 'E-mail & senha são obrigatórios.'
            });

            return;
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Credênciais inválidas.'
            });

            return;
        }

        if (!user.password) {
            res.status(400).json({
                success: false,
                message: 'Essa conta foi criada com o Google. Use "Continuar com Google".'
            });

            return;
        }

        const isValidPassword = await samePassword(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({
                success: false,
                message: 'Credênciais inválidas.'
            });

            return;
        }

        const token = generateJWTToken(user.uuid, user.email, user.role);

        const userData = formatUserData(user);

        const authData: AuthData = {
            user: userData,
            token
        };

        res.status(200).json({
            success: true,
            message: 'Autenticado com sucesso',
            data: authData
        });

        return;

    } catch (err) {

        console.error('Ocorreu um problema ao tentar autenticar:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}

export const getUsers = async (_req: Request, res: Response): Promise<void> => {

    try {

        const users = await getOrSetCache(
            CacheKeys.usersList,
            async () =>
                prisma.user.findMany({
                    select: {
                        id: true,
                        uuid: true,
                        name: true,
                        email: true,
                        confirmed_email: true,
                        phone: true,
                        role: true,
                        utm_source: true,
                        tag: true,
                        createdAt: true,
                        updatedAt: true
                    } as any,
                }),
            { tag: CacheTags.users, ttlSeconds: 60 }
        );

        res.status(200).json({
            success: true,
            message: 'Usuários recolhidos.',
            data: users
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro na busca de usuários:', err)

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
};

export const getUserByUuid = async (req: Request, res: Response): Promise<void> => {

    try {
        const { uuid } = req.params;

        if (!uuid) {
            res.status(400).json({
                success: false,
                message: "O UUID do usuário é obrigatório."
            });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { uuid },
            select: {
                id: true,
                uuid: true,
                name: true,
                email: true,
                confirmed_email: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                message: "Usuário não encontrado."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Dados do usuário coletados.",
            data: user
        });

        return;
    } catch (err) {
        console.error('Ocorreu um erro ao buscar um usuário:', err)

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });

        return;
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uuid } = req.params;
        const updateData: UpdateUserData = req.body;

        if (!uuid) {
            res.status(400).json({
                success: false,
                message: "O UUID do usuário é obrigatório."
            });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { uuid }
        });

        if (!existingUser) {
            res.status(404).json({
                success: false,
                message: 'Usuário não encontrado.'
            });

            return;
        }

        if (updateData.email && updateData.email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: updateData.email }
            });

            if (emailExists) {
                res.status(409).json({
                    success: false,
                    message: 'O e-mail já está cadastrado.'
                });

                return;
            }
        }

        if (updateData.password) {
            updateData.password = await generateCryptPassword(updateData.password);
        }

        const { role, ...updateDataWithoutRole } = updateData;

        const blockFields = ["id", "uuid"];
        const safeUpdateData = Object.fromEntries(
            Object.entries(updateDataWithoutRole)
                .filter(([key]) => !blockFields.includes(key))
        );

        const updatedUser = await prisma.user.update({
            where: { uuid },
            data: {
                ...safeUpdateData,
                ...(role && { role: role as 'CLIENT' | 'ADMIN' })
            },
            select: {
                id: true,
                uuid: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        await invalidateByTag(CacheTags.users);

        res.status(200).json({
            success: true,
            message: 'Usuário atualizado com sucesso',
            data: updatedUser
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao atualizar um usuário:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uuid } = req.params;

        if (!uuid) {
            res.status(400).json({
                success: false,
                message: "O UUID do usuário é obrigatório."
            });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { uuid }
        });

        if (!existingUser) {
            res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });

            return;
        }

        await prisma.user.delete({
            where: { uuid }
        });

        await invalidateByTag(CacheTags.users);

        res.status(200).json({
            success: true,
            message: 'Usuário deletado com sucesso'
        });

        return;
    } catch (err) {

        console.error('Ocorreu um erro ao deletar um usuário:', err);

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

        return;
    }
}