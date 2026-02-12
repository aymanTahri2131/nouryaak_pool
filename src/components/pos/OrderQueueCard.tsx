import { Order } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Clock, User, ChefHat, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface OrderQueueCardProps {
  order: Order;
  onMarkPreparing?: () => void;
  onMarkReady?: () => void;
}

export const OrderQueueCard = ({ order, onMarkPreparing, onMarkReady }: OrderQueueCardProps) => {
  const { t } = useApp();
  return (
    <div
      className={cn(
        'pos-card flex flex-col gap-4 border-l-4',
        order.status === 'new' && 'border-l-status-ordered',
        order.status === 'preparing' && 'border-l-status-preparing animate-pulse-soft',
        order.status === 'ready' && 'border-l-status-ready'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {t('Table', 'Table', 'طاولة')} #{typeof order.tableId === 'object' && order.tableId && 'number' in order.tableId ? (order.tableId as any).number : (order.tableId as string).replace('table-', '')}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDistanceToNow(order.createdAt, { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{order.waiterName}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {item.quantity}x {item.productName}
            </span>
            {(item.selectedOptions && item.selectedOptions.length > 0) || item.sugar !== undefined ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.selectedOptions?.map(opt => (
                  <span key={opt} className="text-[9px] bg-primary/10 text-primary px-1 font-bold rounded">
                    {opt}
                  </span>
                ))}
                {item.sugar !== undefined && item.sugar > 0 && (
                  <span className="text-[9px] bg-orange-100 text-orange-700 px-1 font-bold rounded">
                    S:{item.sugar}
                  </span>
                )}
              </div>
            ) : null}
            {item.notes && (
              <span className="text-xs text-muted-foreground italic">
                {item.notes}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-lg bg-secondary/50 p-2 text-sm text-muted-foreground">
          <span className="font-medium">{t('Note', 'Note', 'ملاحظة')}:</span> {order.notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {order.status === 'new' && onMarkPreparing && (
          <Button
            className="flex-1 touch-target"
            variant="default"
            onClick={onMarkPreparing}
          >
            <ChefHat className="me-2 h-5 w-5" />
            {t('Start Preparing', 'Commencer la préparation', 'بدء التحضير')}
          </Button>
        )}
        {order.status === 'preparing' && onMarkReady && (
          <Button
            className="flex-1 touch-target bg-status-ready hover:bg-status-ready/90"
            onClick={onMarkReady}
          >
            <Check className="me-2 h-5 w-5" />
            {t('Mark Ready', 'Marquer prêt', 'تحديد كجاهز')}
          </Button>
        )}
      </div>
    </div>
  );
};
