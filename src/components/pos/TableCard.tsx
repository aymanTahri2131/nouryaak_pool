import { CafeTable } from '@/types';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { Users, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface TableCardProps {
  table: CafeTable;
  onClick?: () => void;
  selected?: boolean;
  onDelete?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
}

const statusBorderColors: Record<string, string> = {
  free: 'border-status-free/50 hover:border-status-free',
  ordered: 'border-status-ordered/50 hover:border-status-ordered',
  preparing: 'border-status-preparing/50 hover:border-status-preparing',
  ready: 'border-status-ready/50 hover:border-status-ready',
  served: 'border-status-served/50 hover:border-status-served',
  paid: 'border-status-paid/50 hover:border-status-paid',
};

export const TableCard = ({ table, onClick, selected, onDelete, onEdit }: TableCardProps) => {
  const { t, language } = useApp();
  return (
    <div
      onClick={onClick}
      className={cn(
        'pos-card-interactive flex flex-col gap-3 border-2 transition-all duration-200 relative group',
        statusBorderColors[table.status],
        selected && 'ring-2 ring-primary ring-offset-2',
        table.status === 'ready' && 'animate-pulse-soft'
      )}
    >
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute -top-2 -end-10 p-1.5 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-primary/90 z-10"
          title={t('Edit table', 'Modifier la table', 'تعديل الطاولة')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-2 -end-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-destructive/90 z-10"
          title={t('Delete table', 'Supprimer la table', 'حذف الطاولة')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">
            #{table.number}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{table.capacity}</span>
          </div>
        </div>
        <StatusBadge
          status={table.status === 'free' ? 'free' : 'occupied'}
          size="sm"
          language={language}
        />
      </div>

      {/* Order Summary */}
      {table.currentOrder && (
        <div className="border-t pt-2">
          <p className="text-sm text-muted-foreground">
            {table.currentOrder.items.length} {t('items', 'articles', 'منتجات')} • ${table.currentOrder.total.toFixed(2)}
          </p>
        </div>
      )}

      {/* Waiter */}
      {table.waiterName && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>{table.waiterName}</span>
        </div>
      )}
    </div>
  );
};
