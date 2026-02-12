import { useApp } from '@/contexts/AppContext';
import { Order } from '@/types';
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
import { DollarSign, Clock, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface UnpaidOrdersProps {
    orders: Order[];
    isLoading: boolean;
    onMarkPaid: (orderId: string) => void;
}

export const UnpaidOrders = ({ orders, isLoading, onMarkPaid }: UnpaidOrdersProps) => {
    const { t } = useApp();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold">{t('Unpaid Orders', 'Commandes non payées', 'طلبات غير مدفوعة')}</h2>
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 pt-8 border-t">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                    {t('Unpaid Orders', 'Commandes non payées', 'طلبات غير مدفوعة')}
                </h2>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    {orders.length} {t('Pending', 'En attente', 'قيد الانتظار')}
                </Badge>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>{t('Order #', 'N° Commande', 'رقم الطلب')}</TableHead>
                            <TableHead>{t('Info', 'Info', 'معلومات')}</TableHead>
                            <TableHead>{t('Time', 'Heure', 'الوقت')}</TableHead>
                            <TableHead>{t('Amount', 'Montant', 'المبلغ')}</TableHead>
                            <TableHead className="text-end">{t('Action', 'Action', 'الإجراء')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-primary" />
                                    <span>#{order.orderNumber || order.id.slice(-4)}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                        {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(order.createdAt), 'HH:mm')}
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-primary">
                                    {order.total.toFixed(2)} DH
                                </TableCell>
                                <TableCell className="text-end">
                                    <Button
                                        size="sm"
                                        className="bg-status-ready hover:bg-status-ready/90 h-9"
                                        onClick={() => onMarkPaid(order.id)}
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
