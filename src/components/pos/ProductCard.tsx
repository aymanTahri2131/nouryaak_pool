import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  disabled?: boolean;
}

export const ProductCard = ({ product, onClick, disabled }: ProductCardProps) => {
  const { t } = useApp();
  return (
    <button
      onClick={onClick}
      disabled={disabled || !product.isAvailable}
      className={cn(
        'pos-card-interactive flex flex-col items-center justify-center gap-2 p-4 text-center min-h-[120px]',
        'touch-target',
        !product.isAvailable && 'opacity-50 cursor-not-allowed',
        disabled && 'pointer-events-none'
      )}
    >
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm font-medium text-foreground leading-tight">
          {t(product.nameEn, product.nameFr, product.nameAr || product.nameEn)}
        </span>
      </div>
      <div className="flex items-center justify-between w-full">
        <span className="text-lg font-bold text-primary">
          {product.price.toFixed(2)} DH
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
};
