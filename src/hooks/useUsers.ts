// ============================================
// User Management Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type GetUsersParams, type CreateUserInput, type UpdateUserInput } from '@/apis/users.api';
import type { User } from '@/types';

// Query keys
const USERS_KEYS = {
    all: ['users'] as const,
    lists: () => [...USERS_KEYS.all, 'list'] as const,
    list: (params?: GetUsersParams) => [...USERS_KEYS.lists(), params] as const,
    details: () => [...USERS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...USERS_KEYS.details(), id] as const,
};

// Fetch users list with filters
export function useUsers(params?: GetUsersParams) {
    return useQuery({
        queryKey: USERS_KEYS.list(params),
        queryFn: () => usersApi.getUsers(params),
    });
}

// Fetch single user by ID
export function useUserById(id: string) {
    return useQuery({
        queryKey: USERS_KEYS.detail(id),
        queryFn: () => usersApi.getUserById(id),
        enabled: !!id,
    });
}

// Create user mutation
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
        onSuccess: () => {
            // Invalidate all user lists to refetch
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
        },
    });
}

// Update user mutation
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => usersApi.updateUser(id, input),
        onSuccess: (updatedUser) => {
            // Invalidate all user lists
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
            // Update the specific user detail cache
            queryClient.setQueryData(USERS_KEYS.detail(updatedUser.id), updatedUser);
        },
    });
}

// Delete user mutation
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => usersApi.deleteUser(id),
        onSuccess: () => {
            // Invalidate all user lists to refetch
            queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
        },
    });
}
