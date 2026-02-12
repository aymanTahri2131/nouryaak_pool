import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import type { User } from '@/types';

interface DeleteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    onConfirm: () => Promise<void>;
    isLoading?: boolean;
}

export function DeleteUserDialog({ open, onOpenChange, user, onConfirm, isLoading }: DeleteUserDialogProps) {
    const { t } = useApp();

    if (!user) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('Delete User', 'Supprimer l\'utilisateur', 'حذف المستخدم')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(
                            `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
                            `Êtes-vous sûr de vouloir supprimer "${user.name}" ? Cette action est irréversible.`,
                            `هل أنت متأكد أنك تريد حذف "${user.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{t('Cancel', 'Annuler', 'إلغاء')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isLoading ? t('Deleting...', 'Suppression...', 'جاري الحذف...') : t('Delete', 'Supprimer', 'حذف')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
