import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePoolTables, useDeletePoolTable } from '@/hooks/usePoolTables';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { PoolTable } from '@/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CircleDot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PoolTableDialog } from '@/components/pos/PoolTableDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PoolManagement = () => {
    const { t } = useApp();
    const { data: tables = [], isLoading } = usePoolTables();
    const deleteMutation = useDeletePoolTable();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<PoolTable | null>(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [tableToDelete, setTableToDelete] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!tableToDelete) return;
        try {
            await deleteMutation.mutateAsync(tableToDelete);
            toast.success(t('Table deleted', 'Table supprimée', 'تم حذف الطاولة'));
            setDeleteConfirmOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to delete', 'Échec de la suppression', 'فشل الحذف'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {t('Pool Management', 'Gestion du Billard', 'إدارة البلياردو')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('Configure your pool tables and pricing', 'Configurez vos tables de billard et tarifs', 'إعداد طاولات البلياردو والأسعار')}
                    </p>
                </div>
                <Button onClick={() => { setSelectedTable(null); setDialogOpen(true); }}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('Add Table', 'Ajouter Table', 'إضافة طاولة')}
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">{t('Number', 'N°', 'رقم')}</TableHead>
                                <TableHead>{t('Name', 'Nom', 'الاسم')}</TableHead>
                                <TableHead>{t('Price / Piece', 'Prix / Pièce', 'السعر / قطعة')}</TableHead>
                                <TableHead>{t('Status', 'Statut', 'الحالة')}</TableHead>
                                <TableHead className="text-end">{t('Actions', 'Actions', 'الإجراءات')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tables.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {t('No pool tables found', 'Aucune table trouvée', 'لا توجد طاولات')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tables.map((table) => (
                                    <TableRow key={table.id}>
                                        <TableCell className="font-bold">#{table.number}</TableCell>
                                        <TableCell>{table.name}</TableCell>
                                        <TableCell>{table.pricePerPiece.toFixed(2)} DH</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <CircleDot
                                                    className={`h-3 w-3 ${table.status === 'available' ? 'text-green-500' : 'text-amber-500'}`}
                                                />
                                                <span className="capitalize">{table.status === 'available' ? t('Available', 'Libre', 'متاح') : t('Occupied', 'Occupée', 'مشغول')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setSelectedTable(table); setDialogOpen(true); }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => { setTableToDelete(table.id); setDeleteConfirmOpen(true); }}
                                                    disabled={table.status === 'occupied'}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <PoolTableDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                table={selectedTable}
            />

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Delete Pool Table?', 'Supprimer la table ?', 'حذف طاولة البلياردو؟')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('Are you sure you want to delete this table? This action cannot be undone.', 'Êtes-vous sûr de vouloir supprimer cette table ? Cette action est irréversible.', 'هل أنت متأكد من رغبتك في حذف هذه الطاولة؟ لا يمكن التراجع عن هذا الإجراء.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTableToDelete(null)}>{t('Cancel', 'Annuler', 'إلغاء')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            {t('Delete', 'Supprimer', 'حذف')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PoolManagement;
