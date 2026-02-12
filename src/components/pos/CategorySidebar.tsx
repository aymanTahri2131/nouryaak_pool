import { Category } from '@/types';
import { cn } from '@/lib/utils';
import { Coffee, GlassWater, Cookie, Cake, Wind } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface CategorySidebarProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'cat-1': Coffee,
  'cat-2': GlassWater,
  'cat-3': Cookie,
  'cat-4': Cake,
  'cat-5': Wind,
};

export const CategorySidebar = ({ categories, selectedId, onSelect }: CategorySidebarProps) => {
  const { t } = useApp();
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => onSelect('')}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 text-start transition-all touch-target',
          !selectedId
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary hover:bg-secondary/80 text-foreground'
        )}
      >
        <Coffee className="h-5 w-5" />
        <span className="font-medium">{t('All Items', 'Tous les articles', 'جميع الأصناف')}</span>
      </button>

      {categories.map((category) => {
        const Icon = categoryIcons[category.id] || Coffee;
        const isSelected = selectedId === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-start transition-all touch-target',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{t(category.nameEn, category.nameFr, category.nameAr || category.nameEn)}</span>
          </button>
        );
      })}
    </div>
  );
};
