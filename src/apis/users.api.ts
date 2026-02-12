// ============================================
// Users API
// ============================================

import { fetchWithAuth, handleResponse } from './client';
import { mapUser } from './mappers';
import type { User } from '@/types';

export interface GetUsersParams {
    role?: 'admin' | 'waiter' | 'bartender' | 'pool_manager';
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

export interface GetUsersResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'waiter' | 'bartender' | 'pool_manager';
    pin?: string;
    avatar?: string;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'waiter' | 'bartender' | 'pool_manager';
    pin?: string | null;
    avatar?: string | null;
    isActive?: boolean;
}

export const usersApi = {
    async getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
        const searchParams = new URLSearchParams();
        if (params?.role) searchParams.append('role', params.role);
        if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
        if (params?.search) searchParams.append('search', params.search);
        if (params?.page) searchParams.append('page', String(params.page));
        if (params?.limit) searchParams.append('limit', String(params.limit));

        const queryString = searchParams.toString();
        const response = await fetchWithAuth(`/users${queryString ? `?${queryString}` : ''}`);
        const data = await handleResponse<{
            data: {
                users: Record<string, unknown>[];
                pagination: { total: number; page: number; limit: number; totalPages: number };
            };
        }>(response);

        return {
            users: (data.data.users || []).map(mapUser),
            total: data.data.pagination.total,
            page: data.data.pagination.page,
            limit: data.data.pagination.limit,
            totalPages: data.data.pagination.totalPages,
        };
    },

    async getUserById(id: string): Promise<User> {
        const response = await fetchWithAuth(`/users/${id}`);
        const data = await handleResponse<{ data: { user: Record<string, unknown> } }>(response);
        return mapUser(data.data.user);
    },

    async createUser(input: CreateUserInput): Promise<User> {
        const response = await fetchWithAuth('/users', {
            method: 'POST',
            body: JSON.stringify(input),
        });
        const data = await handleResponse<{ data: { user: Record<string, unknown> } }>(response);
        return mapUser(data.data.user);
    },

    async updateUser(id: string, input: UpdateUserInput): Promise<User> {
        const response = await fetchWithAuth(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(input),
        });
        const data = await handleResponse<{ data: { user: Record<string, unknown> } }>(response);
        return mapUser(data.data.user);
    },

    async deleteUser(id: string): Promise<void> {
        const response = await fetchWithAuth(`/users/${id}`, {
            method: 'DELETE',
        });
        await handleResponse<{ data: { message: string } }>(response);
    },
};
