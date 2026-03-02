import { useApp } from '@/contexts/AppContext';
import { PoolPlayer } from '@/apis/poolPlayers.api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeletePoolPlayerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    player: PoolPlayer | null;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function DeletePoolPlayerDialog({
    open,
    onOpenChange,
    player,
    onConfirm,
    isLoading = false,
}: DeletePoolPlayerDialogProps) {
    const { t } = useApp();

    if (!player) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 min-w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">
                                {t('Delete Pool Player', 'Supprimer le joueur', 'حذف لاعب البلياردو')}
                            </DialogTitle>
                            <DialogDescription className="mt-1.5">
                                {t(
                                    'Are you sure you want to delete this pool player? This action cannot be undone.',
                                    'Êtes-vous sûr de vouloir supprimer ce joueur de billard ? Cette action est irréversible.',
                                    'هل أنت متأكد أنك تريد حذف لاعب البلياردو هذا؟ لا يمكن التراجع عن هذا الإجراء.'
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="bg-muted/50 p-4 rounded-lg my-4 flex items-center gap-4">
                    <div className="h-10 w-10 min-w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {player.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {t('Matches Played', 'Matchs joués', 'المباريات الملعوبة')}: {player.matchesPlayed}
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        {t('Cancel', 'Annuler', 'إلغاء')}
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? t('Deleting...', 'Suppression...', 'جاري الحذف...') : t('Delete Player', 'Supprimer le joueur', 'حذف اللاعب')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
