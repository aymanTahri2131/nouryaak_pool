import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PoolTable } from '@/types';
import { useEndPoolSession } from '@/hooks/usePoolTables';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';

interface ChallengeResultDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: PoolTable | null;
}

export const ChallengeResultDialog = ({ open, onOpenChange, table }: ChallengeResultDialogProps) => {
    const { t } = useApp();
    const endSessionMutation = useEndPoolSession();

    const [player1Score, setPlayer1Score] = useState(0);
    const [player2Score, setPlayer2Score] = useState(0);
    const [winnerId, setWinnerId] = useState<1 | 2 | null>(null);

    const challenge = table?.currentSession?.challenge;

    useEffect(() => {
        if (challenge) {
            setPlayer1Score(challenge.player1Score);
            setPlayer2Score(challenge.player2Score);
            setWinnerId(null);
        }
    }, [challenge, open]);

    const handleFinish = async () => {
        if (!table) return;
        if (!winnerId) {
            toast.error(t('Please select a winner', 'Veuillez sélectionner un vainqueur', 'الرجاء اختيار الفائز'));
            return;
        }

        try {
            await endSessionMutation.mutateAsync({
                tableId: table.id,
                results: {
                    player1Score,
                    player2Score,
                    winnerId,
                },
            });
            toast.success(t('Session ended and result recorded!', 'Session terminée et résultat enregistré!', 'تم إنهاء التحدي وتسجيل النتيجة!'));
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to end session', 'Échec de la fin de session', 'فشل إنهاء التحدي'));
        }
    };

    if (!challenge) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-pool" />
                        {t('Match Results', 'Résultats du match', 'نتائج المباراة')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-center block font-bold truncate">{challenge.player1Name}</Label>
                            <Input
                                type="number"
                                min={0}
                                max={winnerId === 2 ? challenge.mode - 1 : undefined}
                                value={player1Score}
                                onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                                className="text-center text-2xl h-16 font-bold"
                                disabled={winnerId === 1}
                            />
                            <Button
                                variant={winnerId === 1 ? 'default' : 'outline'}
                                className="w-full"
                                onClick={() => {
                                    setWinnerId(1);
                                    setPlayer1Score(challenge.mode);
                                    if (player2Score >= challenge.mode) setPlayer2Score(challenge.mode - 1);
                                }}
                            >
                                {t('Winner', 'Vainqueur', 'الفائز')}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-center block font-bold truncate">{challenge.player2Name}</Label>
                            <Input
                                type="number"
                                min={0}
                                max={winnerId === 1 ? challenge.mode - 1 : undefined}
                                value={player2Score}
                                onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                                className="text-center text-2xl h-16 font-bold"
                                disabled={winnerId === 2}
                            />
                            <Button
                                variant={winnerId === 2 ? 'default' : 'outline'}
                                className="w-full"
                                onClick={() => {
                                    setWinnerId(2);
                                    setPlayer2Score(challenge.mode);
                                    if (player1Score >= challenge.mode) setPlayer1Score(challenge.mode - 1);
                                }}
                            >
                                {t('Winner', 'Vainqueur', 'الفائز')}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl bg-secondary p-4 text-center">
                        <p className="text-sm text-muted-foreground">{t('Total Amount', 'Montant Total', 'المبلغ الإجمالي')}</p>
                        <p className="text-2xl font-bold">
                            {((player1Score + player2Score) * challenge.pricePerGame).toFixed(2)} DH
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleFinish}
                        className="w-full h-12 text-lg"
                        disabled={endSessionMutation.isPending}
                    >
                        {t('End Session', 'Terminer la session', 'إنهاء التحدي')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
