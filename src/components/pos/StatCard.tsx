import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border',
  primary: 'bg-primary/10 border-primary/20',
  success: 'bg-status-free/10 border-status-free/20',
  warning: 'bg-status-preparing/10 border-status-preparing/20',
  danger: 'bg-status-occupied/10 border-status-occupied/20',
};

const iconVariantStyles = {
  default: 'bg-secondary text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-status-free/20 text-status-free',
  warning: 'bg-status-preparing/20 text-status-preparing',
  danger: 'bg-status-occupied/20 text-status-occupied',
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) => {
  const { t } = useApp();
  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-status-free' : 'text-status-occupied'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}% {t('from yesterday', "d'hier", 'من الأمس')}
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            iconVariantStyles[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
