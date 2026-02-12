import { TableStatus, OrderStatus, PoolTableStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TableStatus | OrderStatus | PoolTableStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  language?: 'en' | 'fr' | 'ar';
}

const statusConfig: Record<string, { bg: string; text: string; label: { en: string; fr: string; ar: string } }> = {
  // Table & Order statuses
  free: { bg: 'bg-status-free', text: 'text-status-free-foreground', label: { en: 'Free', fr: 'Libre', ar: 'متاح' } },
  new: { bg: 'bg-status-ordered', text: 'text-status-ordered-foreground', label: { en: 'New', fr: 'Nouveau', ar: 'جديد' } },
  ordered: { bg: 'bg-status-ordered', text: 'text-status-ordered-foreground', label: { en: 'Ordered', fr: 'Commandé', ar: 'تم الطلب' } },
  preparing: { bg: 'bg-status-preparing', text: 'text-status-preparing-foreground', label: { en: 'Preparing', fr: 'En préparation', ar: 'جاري التحضير' } },
  ready: { bg: 'bg-status-ready', text: 'text-status-ready-foreground', label: { en: 'Ready', fr: 'Prêt', ar: 'جاهز' } },
  served: { bg: 'bg-status-served', text: 'text-status-served-foreground', label: { en: 'Served', fr: 'Servi', ar: 'تم تقديم الخدمة' } },
  paid: { bg: 'bg-status-paid', text: 'text-status-paid-foreground', label: { en: 'Paid', fr: 'Payé', ar: 'مدفوع' } },
  // Pool statuses
  available: { bg: 'bg-status-free', text: 'text-status-free-foreground', label: { en: 'Available', fr: 'Disponible', ar: 'متاح' } },
  occupied: { bg: 'bg-status-occupied', text: 'text-status-occupied-foreground', label: { en: 'Occupied', fr: 'Occupé', ar: 'غير متاح' } },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export const StatusBadge = ({ status, size = 'md', className, language }: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.free;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        config.bg,
        config.text,
        sizeClasses[size],
        status === 'preparing' && 'animate-pulse-soft',
        className
      )}
    >
      {config.label[language]}
    </span>
  );
};

export const getStatusLabel = (status: string, language: 'en' | 'fr' | 'ar' = 'en'): string => {
  return statusConfig[status]?.label[language] || status;
};
