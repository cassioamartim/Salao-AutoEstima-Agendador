export interface UserData {
    uuid: string;
    name: string;
    email: string;
    confirmed_email: boolean;
    phone: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserData {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
}

export interface UpdateUserData {
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
}

export interface AuthPayload {
    email: string;
    password: string;
}

export interface AuthData {
    user: UserData;
    token: string;
}