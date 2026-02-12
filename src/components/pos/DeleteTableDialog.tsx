import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import type { CafeTable } from '@/types';

interface DeleteTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: CafeTable | null;
    onConfirm: () => Promise<void>;
    isLoading?: boolean;
}

export function DeleteTableDialog({ open, onOpenChange, table, onConfirm, isLoading }: DeleteTableDialogProps) {
    const { t } = useApp();

    if (!table) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('Delete Table', 'Supprimer la table', 'حذف الطاولة')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            `Are you sure you want to delete table "${table.name}" (#${table.number})? This action cannot be undone.`,
                            `Êtes-vous sûr de vouloir supprimer la table "${table.name}" (#${table.number}) ? Cette action est irréversible.`,
                            `هل أنت متأكد من أنك تريد حذف الطاولة "${table.name}" (#${table.number})؟ هذه الخطوة لا يمكن التراجع عنها.`
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{t('Cancel', 'Annuler', 'إلغاء')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isLoading ? t('Deleting...', 'Suppression...', 'حذف...') : t('Delete', 'Supprimer', 'حذف')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
