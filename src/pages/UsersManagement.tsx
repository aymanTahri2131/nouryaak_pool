import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserDialog } from '@/components/users/UserDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { toast } from 'sonner';
import { UserPlus, Edit, Trash2, Search } from 'lucide-react';
import type { User, UserRole } from '@/types';
import type { CreateUserInput, UpdateUserInput } from '@/apis/users.api';

const UsersManagement = () => {
    const { t, currentUser } = useApp();
    const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    // Dialogs state
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Fetch users with filters
    const { data, isLoading } = useUsers({
        role: selectedRole || undefined,
        isActive: isActiveFilter,
        search: searchQuery || undefined,
        page,
        limit: 20,
    });

    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();

    const users = data?.users || [];
    const pagination = data
        ? { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages }
        : { total: 0, page: 1, limit: 20, totalPages: 0 };

    // Only allow admin users to access this page
    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-destructive">{t('Access Denied', 'Accès refusé', 'تم رفض الوصول')}</h2>
                    <p className="text-muted-foreground mt-2">{t('You do not have permission to access this page', 'Vous n\'avez pas la permission d\'accéder à cette page', 'ليس لديك صلاحية للوصول إلى هذه الصفحة')}</p>
                </div>
            </div>
        );
    }

    const handleCreateUser = async (data: CreateUserInput | UpdateUserInput) => {
        try {
            await createUserMutation.mutateAsync(data as CreateUserInput);
            toast.success(t('User created successfully', 'Utilisateur créé avec succès', 'تم إنشاء المستخدم بنجاح'));
            setUserDialogOpen(false);
            setSelectedUser(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to create user', 'Échec de la création de l\'utilisateur', 'فشل إنشاء المستخدم'));
        }
    };

    const handleUpdateUser = async (data: CreateUserInput | UpdateUserInput) => {
        if (!selectedUser) return;

        try {
            await updateUserMutation.mutateAsync({ id: selectedUser.id, input: data as UpdateUserInput });
            toast.success(t('User updated successfully', 'Utilisateur mis à jour avec succès', 'تم تحديث المستخدم بنجاح'));
            setUserDialogOpen(false);
            setSelectedUser(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to update user', 'Échec de la mise à jour de l\'utilisateur', 'فشل تحديث المستخدم'));
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await deleteUserMutation.mutateAsync(selectedUser.id);
            toast.success(t('User deleted successfully', 'Utilisateur supprimé avec succès', 'تم حذف المستخدم بنجاح'));
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to delete user', 'Échec de la suppression de l\'utilisateur', 'فشل حذف المستخدم'));
        }
    };

    const openCreateDialog = () => {
        setSelectedUser(null);
        setUserDialogOpen(true);
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setUserDialogOpen(true);
    };

    const openDeleteDialog = (user: User) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return 'default';
            case 'waiter':
                return 'secondary';
            case 'bartender':
                return 'outline';
            case 'pool_manager':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return t('Admin', 'Administrateur', 'مدير');
            case 'waiter':
                return t('Waiter', 'Serveur', 'نادل');
            case 'bartender':
                return t('Bartender', 'Barman', 'بارمان');
            case 'pool_manager':
                return t('Pool Manager', 'Gestionnaire de billard', 'مدير البلياردو');
            default:
                return role;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('Users Management', 'Gestion des utilisateurs', 'إدارة المستخدمين')}</h1>
                    <p className="text-muted-foreground mt-1">{t('Manage system users and permissions', 'Gérer les utilisateurs et les permissions du système', 'إدارة مستخدمي النظام والصلاحيات')}</p>
                </div>
                <Button onClick={openCreateDialog} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t('Add User', 'Ajouter un utilisateur', 'إضافة مستخدم')}
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('Search by name or email...', 'Rechercher par nom ou email...', 'البحث بالاسم أو البريد الإلكتروني...')}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="ps-10"
                    />
                </div>

                {/* Role Filter */}
                <div className="flex flex-wrap gap-2">
                    <Button variant={selectedRole === '' ? 'default' : 'outline'} onClick={() => setSelectedRole('')} size="sm">
                        {t('All', 'Tout', 'الكل')}
                    </Button>
                    <Button variant={selectedRole === 'admin' ? 'default' : 'outline'} onClick={() => setSelectedRole('admin')} size="sm">
                        {t('Admin', 'Admin', 'مدير')}
                    </Button>
                    <Button variant={selectedRole === 'waiter' ? 'default' : 'outline'} onClick={() => setSelectedRole('waiter')} size="sm">
                        {t('Waiter', 'Serveur', 'نادل')}
                    </Button>
                    <Button variant={selectedRole === 'bartender' ? 'default' : 'outline'} onClick={() => setSelectedRole('bartender')} size="sm">
                        {t('Bartender', 'Barman', 'بارمان')}
                    </Button>
                    <Button variant={selectedRole === 'pool_manager' ? 'default' : 'outline'} onClick={() => setSelectedRole('pool_manager')} size="sm">
                        {t('Pool Mgr', 'Gest. Billard', 'مدير البلياردو')}
                    </Button>
                </div>

                {/* Active Filter */}
                <div className="flex gap-2">
                    <Button variant={isActiveFilter === undefined ? 'default' : 'outline'} onClick={() => setIsActiveFilter(undefined)} size="sm">
                        {t('All', 'Tout', 'الكل')}
                    </Button>
                    <Button variant={isActiveFilter === true ? 'default' : 'outline'} onClick={() => setIsActiveFilter(true)} size="sm">
                        {t('Active', 'Actif', 'نشط')}
                    </Button>
                    <Button variant={isActiveFilter === false ? 'default' : 'outline'} onClick={() => setIsActiveFilter(false)} size="sm">
                        {t('Inactive', 'Inactif', 'غير نشط')}
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="divide-y">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="px-6 py-4">
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : users.length === 0 ? (
                <div className="rounded-xl border bg-card p-12 text-center">
                    <p className="text-muted-foreground">{t('No users found', 'Aucun utilisateur trouvé', 'لم يتم العثور على مستخدمين')}</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_120px] gap-4 border-b bg-secondary/50 px-6 py-4 text-sm font-semibold text-muted-foreground">
                            <div>{t('Name', 'Nom', 'الاسم')}</div>
                            <div>{t('Email', 'Email', 'البريد الإلكتروني')}</div>
                            <div>{t('Role', 'Rôle', 'الدور')}</div>
                            <div>{t('Status', 'Statut', 'الحالة')}</div>
                            <div className="text-center">{t('Actions', 'Actions', 'الإجراءات')}</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y">
                            {users.map((user) => (
                                <div key={user.id} className="grid grid-cols-[2fr_2fr_1.5fr_1fr_120px] gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{user.name}</p>
                                            {user.pin && <p className="text-xs text-muted-foreground">PIN: ••••</p>}
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate" title={user.email}>{user.email}</div>
                                    <div>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                                    </div>
                                    <div>
                                        <Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? t('Active', 'Actif', 'نشط') : t('Inactive', 'Inactif', 'غير نشط')}</Badge>
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} title={t('Edit', 'Modifier', 'تعديل')}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user)} title={t('Delete', 'Supprimer', 'حذف')} className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {users.map((user) => (
                            <div key={user.id} className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{user.name}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant={user.isActive ? 'default' : 'secondary'} className="h-6">
                                        {user.isActive ? t('Active', 'Actif', 'نشط') : t('Inactive', 'Inactif', 'غير نشط')}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('Role', 'Rôle', 'الدور')}</span>
                                        <div>
                                            <Badge variant={getRoleBadgeVariant(user.role)} className="w-full justify-center">
                                                {getRoleLabel(user.role)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('PIN Code', 'Code PIN', 'رمز PIN')}</span>
                                        <div className="font-mono text-sm font-bold flex items-center gap-2">
                                            {user.pin ? (
                                                <>
                                                    <span className="text-primary">• • • •</span>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t">
                                    <Button variant="outline" className="flex-1 gap-2" onClick={() => openEditDialog(user)}>
                                        <Edit className="h-4 w-4" />
                                        {t('Edit', 'Modifier', 'تعديل')}
                                    </Button>
                                    <Button variant="outline" className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => openDeleteDialog(user)}>
                                        <Trash2 className="h-4 w-4" />
                                        {t('Delete', 'Supprimer', 'حذف')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`,
                                    `Affichage de ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} sur ${pagination.total}`,
                                    `عرض ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} من ${pagination.total}`
                                )}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page === 1}>
                                    {t('Previous', 'Précédent', 'السابق')}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page === pagination.totalPages}>
                                    {t('Next', 'Suivant', 'التالي')}
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Dialogs */}
            <UserDialog open={userDialogOpen} onOpenChange={setUserDialogOpen} user={selectedUser} onSubmit={selectedUser ? handleUpdateUser : handleCreateUser} isLoading={createUserMutation.isPending || updateUserMutation.isPending} />

            <DeleteUserDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} user={selectedUser} onConfirm={handleDeleteUser} isLoading={deleteUserMutation.isPending} />
        </div>
    );
};

export default UsersManagement;
