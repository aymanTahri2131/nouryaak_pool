import { OrderItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface OrderPanelProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSendOrder: () => void;
  tableNumber?: number;
  disabled?: boolean;
}

export const OrderPanel = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSendOrder,
  tableNumber,
  disabled,
}: OrderPanelProps) => {
  const { t } = useApp();
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">
          {tableNumber ? `${t('Table', 'Table', 'طاولة')} #${tableNumber}` : t('Current Order', 'Commande actuelle', 'الطلب الحالي')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? t('item', 'article', 'منتج') : t('items', 'articles', 'منتجات')}
        </p>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>{t('No items added yet', 'Aucun article ajouté', 'لم تتم إضافة منتجات بعد')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.productName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.unitPrice.toFixed(2)} {t('DH each', 'DH chacun', 'درهم للواحد')}
                  </p>
                  {(item.selectedOptions && item.selectedOptions.length > 0) || item.sugar !== undefined ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedOptions?.map(opt => (
                        <span key={opt} className="text-[14px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold">
                          {opt}
                        </span>
                      ))}
                      {item.sugar !== undefined && item.sugar > 0 && (
                        <span className="text-[14px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full uppercase font-bold">
                          {t('Sugar', 'Sucre', 'سكر')}: {item.sugar}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground w-20 text-end">
                    {(item.unitPrice * item.quantity).toFixed(2)} DH
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4 space-y-4">
        <div className="flex items-center justify-between text-xl font-bold">
          <span>{t('Total', 'Total', 'المجموع')}</span>
          <span className="text-primary">{total.toFixed(2)} DH</span>
        </div>
        <Button
          className="w-full touch-target text-lg"
          size="lg"
          onClick={onSendOrder}
          disabled={disabled || items.length === 0}
        >
          <Send className="me-2 h-5 w-5 rtl:rotate-180" />
          {t('Send Order', 'Envoyer la commande', 'إرسال الطلب')}
        </Button>
      </div>
    </div>
  );
};
