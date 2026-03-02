import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePoolPlayers, useCreatePoolPlayer, useUpdatePoolPlayer, useDeletePoolPlayer } from '@/hooks/usePoolPlayers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PoolPlayerDialog } from '@/components/pool/PoolPlayerDialog';
import { DeletePoolPlayerDialog } from '@/components/pool/DeletePoolPlayerDialog';
import { toast } from 'sonner';
import { UserPlus, Edit, Trash2, Search, Trophy } from 'lucide-react';
import type { PoolPlayer, CreatePoolPlayerInput, UpdatePoolPlayerInput } from '@/apis/poolPlayers.api';

const PoolPlayersManagement = () => {
    const { t, currentUser } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    // Dialogs state
    const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<PoolPlayer | null>(null);

    // Fetch players with search & basic pagination (default limit 50)
    const { data, isLoading } = usePoolPlayers({
        search: searchQuery || undefined,
        page,
        limit: 50,
    });

    const createPlayerMutation = useCreatePoolPlayer();
    const updatePlayerMutation = useUpdatePoolPlayer();
    const deletePlayerMutation = useDeletePoolPlayer();

    const players = data?.players || [];
    const pagination = data?.pagination || { total: 0, page: 1, limit: 50, pages: 0 };

    // Only allow admin or pool_manager users to access this page
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'pool_manager') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-destructive">{t('Access Denied', 'Accès refusé', 'تم رفض الوصول')}</h2>
                    <p className="text-muted-foreground mt-2">{t('You do not have permission to access this page', 'Vous n\'avez pas la permission d\'accéder à cette page', 'ليس لديك صلاحية للوصول إلى هذه الصفحة')}</p>
                </div>
            </div>
        );
    }

    const handleCreatePlayer = async (data: CreatePoolPlayerInput | UpdatePoolPlayerInput) => {
        try {
            await createPlayerMutation.mutateAsync(data as CreatePoolPlayerInput);
            toast.success(t('Pool player created successfully', 'Joueur de billard créé avec succès', 'تم إنشاء لاعب البلياردو بنجاح'));
            setPlayerDialogOpen(false);
            setSelectedPlayer(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to create pool player', 'Échec de la création du joueur', 'فشل إنشاء لاعب البلياردو'));
        }
    };

    const handleUpdatePlayer = async (data: CreatePoolPlayerInput | UpdatePoolPlayerInput) => {
        if (!selectedPlayer) return;

        try {
            await updatePlayerMutation.mutateAsync({ id: selectedPlayer.id, data: data as UpdatePoolPlayerInput });
            toast.success(t('Pool player updated successfully', 'Joueur de billard mis à jour avec succès', 'تم تحديث لاعب البلياردو بنجاح'));
            setPlayerDialogOpen(false);
            setSelectedPlayer(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to update pool player', 'Échec de la mise à jour du joueur', 'فشل تحديث لاعب البلياردو'));
        }
    };

    const handleDeletePlayer = async () => {
        if (!selectedPlayer) return;

        try {
            await deletePlayerMutation.mutateAsync(selectedPlayer.id);
            toast.success(t('Pool player deleted successfully', 'Joueur de billard supprimé avec succès', 'تم حذف لاعب البلياردو بنجاح'));
            setDeleteDialogOpen(false);
            setSelectedPlayer(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to delete pool player', 'Échec de la suppression du joueur', 'فشل حذف لاعب البلياردو'));
        }
    };

    const openCreateDialog = () => {
        setSelectedPlayer(null);
        setPlayerDialogOpen(true);
    };

    const openEditDialog = (player: PoolPlayer) => {
        setSelectedPlayer(player);
        setPlayerDialogOpen(true);
    };

    const openDeleteDialog = (player: PoolPlayer) => {
        setSelectedPlayer(player);
        setDeleteDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {t('Pool Players', 'Joueurs de Billard', 'لاعبي البلياردو')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('Manage registered pool players and their statistics', 'Gérer les joueurs enregistrés et leurs statistiques', 'إدارة اللاعبين المسجلين وإحصائياتهم')}
                    </p>
                </div>
                <Button onClick={openCreateDialog} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t('Add Player', 'Ajouter un joueur', 'إضافة لاعب')}
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('Search by name...', 'Rechercher par nom...', 'البحث بالاسم...')}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="ps-10"
                    />
                </div>
            </div>

            {/* Players Table */}
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
            ) : players.length === 0 ? (
                <div className="rounded-xl border bg-card p-12 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Trophy className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{t('No pool players found', 'Aucun joueur trouvé', 'لم يتم العثور على لاعبين')}</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 border-b bg-secondary/50 px-6 py-4 text-sm font-semibold text-muted-foreground">
                            <div>{t('Name', 'Nom', 'الاسم')}</div>
                            <div className="text-center">{t('Matches', 'Matchs', 'المباريات')}</div>
                            <div className="text-center">{t('Wins', 'Victoires', 'الانتصارات')}</div>
                            <div className="text-center">{t('Losses', 'Défaites', 'الهزائم')}</div>
                            <div className="text-center">{t('Win Rate', 'Taux de victoires', 'معدل الفوز')}</div>
                            <div className="text-center">{t('Actions', 'Actions', 'الإجراءات')}</div>
                        </div>

                        <div className="divide-y">
                            {players.map((player) => (
                                <div key={player.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 min-w-8 rounded-full overflow-hidden border">
                                            <img
                                                src={player.avatarUrl || 'https://res.cloudinary.com/doq0mdnkz/image/upload/v1772425099/gsekayy2xtsfratohk3q.png'}
                                                alt={player.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="font-medium text-foreground">{player.name}</p>
                                    </div>
                                    <div className="text-center font-medium">
                                        {player.matchesPlayed}
                                    </div>
                                    <div className="text-center font-medium text-emerald-600 dark:text-emerald-400">
                                        {player.wins}
                                    </div>
                                    <div className="text-center font-medium text-destructive">
                                        {player.losses}
                                    </div>
                                    <div className="text-center">
                                        <Badge variant={player.winRate > 50 ? 'default' : 'secondary'}>
                                            {player.winRate}%
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(player)} title={t('Edit', 'Modifier', 'تعديل')}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(player)} title={t('Delete', 'Supprimer', 'حذف')} className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {players.map((player) => (
                            <div key={player.id} className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 min-w-10 rounded-full overflow-hidden border">
                                        <img
                                            src={player.avatarUrl || 'https://res.cloudinary.com/doq0mdnkz/image/upload/v1772425099/gsekayy2xtsfratohk3q.png'}
                                            alt={player.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg leading-tight">{player.name}</h3>
                                        <Badge variant={player.winRate > 50 ? 'default' : 'secondary'} className="mt-1">
                                            {t('Win Rate', 'Taux de victoires', 'معدل الفوز')}: {player.winRate}%
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-lg text-center">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('Matches', 'Matchs', 'المباريات')}</p>
                                        <p className="font-bold">{player.matchesPlayed}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-emerald-600/70">{t('Wins', 'Victoires', 'الانتصارات')}</p>
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{player.wins}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-destructive/70">{t('Losses', 'Défaites', 'الهزائم')}</p>
                                        <p className="font-bold text-destructive">{player.losses}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t">
                                    <Button variant="outline" className="flex-1 gap-2" onClick={() => openEditDialog(player)}>
                                        <Edit className="h-4 w-4" />
                                        {t('Edit', 'Modifier', 'تعديل')}
                                    </Button>
                                    <Button variant="outline" className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => openDeleteDialog(player)}>
                                        <Trash2 className="h-4 w-4" />
                                        {t('Delete', 'Supprimer', 'حذف')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-4">
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
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page === pagination.pages}>
                                    {t('Next', 'Suivant', 'التالي')}
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Dialogs */}
            <PoolPlayerDialog
                open={playerDialogOpen}
                onOpenChange={setPlayerDialogOpen}
                player={selectedPlayer}
                onSubmit={selectedPlayer ? handleUpdatePlayer : handleCreatePlayer}
                isLoading={createPlayerMutation.isPending || updatePlayerMutation.isPending}
            />

            <DeletePoolPlayerDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                player={selectedPlayer}
                onConfirm={handleDeletePlayer}
                isLoading={deletePlayerMutation.isPending}
            />
        </div>
    );
};

export default PoolPlayersManagement;
