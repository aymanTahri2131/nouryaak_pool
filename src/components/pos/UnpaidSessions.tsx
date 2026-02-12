import { useApp } from '@/contexts/AppContext';
import { PoolSession } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, User, Trophy, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface UnpaidSessionsProps {
    sessions: PoolSession[];
    isLoading: boolean;
    onMarkPaid: (sessionId: string) => void;
}

export const UnpaidSessions = ({ sessions, isLoading, onMarkPaid }: UnpaidSessionsProps) => {
    const { t } = useApp();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold">{t('Unpaid Sessions', 'Sessions non payées', 'جلسات غير مدفوعة')}</h2>
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                    {t('Unpaid Sessions', 'Sessions non payées', 'جلسات غير مدفوعة')}
                </h2>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    {sessions.length} {t('Pending', 'En attente', 'قيد الانتظار')}
                </Badge>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>{t('Type', 'Type', 'النوع')}</TableHead>
                            <TableHead>{t('Info', 'Info', 'معلومات')}</TableHead>
                            <TableHead>{t('Ended At', 'Terminé à', 'انتهى في')}</TableHead>
                            <TableHead>{t('Amount', 'Montant', 'المبلغ')}</TableHead>
                            <TableHead className="text-end">{t('Action', 'Action', 'الإجراء')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.map((session) => (
                            <TableRow key={session.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium flex items-center gap-2">
                                    {session.type === 'challenge' ? (
                                        <Trophy className="h-4 w-4 text-primary" />
                                    ) : (
                                        <Circle className="h-4 w-4 text-primary" />
                                    )}
                                    <span className="capitalize">{t(session.type, session.type, session.type === 'pieces' ? 'قطع' : 'تحدي')}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {session.type === 'challenge' ? (
                                            <div className="flex items-center gap-1 text-muted-foreground italic">
                                                {session.challenge?.player1Name} vs {session.challenge?.player2Name}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                {session.pieces?.reduce((sum, p) => sum + p.count, 0)} {t('pieces', 'pièces', 'قطع')}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {session.endedAt ? format(new Date(session.endedAt), 'HH:mm') : '-'}
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-primary">
                                    {session.totalCost.toFixed(2)} DH
                                </TableCell>
                                <TableCell className="text-end">
                                    <Button
                                        size="sm"
                                        className="bg-status-ready hover:bg-status-ready/90 h-9"
                                        onClick={() => onMarkPaid(session.id)}
                                    >
                                        <DollarSign className="me-1 h-4 w-4" />
                                        {t('Mark Paid', 'Marquer Payé', 'تم الدفع')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
