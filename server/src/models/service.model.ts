import { Prisma } from "@prisma/client/";

export interface CreateServiceData {
    name: string;
    description: string;
    base_price: Prisma.Decimal;
    ref_images: Prisma.InputJsonValue;
}

export interface UpdateServiceData {
    name: string;
    description: string;
    base_price: Prisma.Decimal;
    ref_images: Prisma.InputJsonValue;
}