import { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCafeTables } from '@/hooks/useCafeTables';
import { useCategories, useAvailableProducts } from '@/hooks/useProducts';
import { useCreateOrder, useAddItemsToOrder } from '@/hooks/useOrders';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CategorySidebar } from '@/components/pos/CategorySidebar';
import { ProductCard } from '@/components/pos/ProductCard';
import { OrderPanel } from '@/components/pos/OrderPanel';
import { ProductOptionsDialog } from '@/components/pos/ProductOptionsDialog';
import { OrderItem, Product } from '@/types';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const NewOrder = () => {
  const { t } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get('table');

  const orderId = searchParams.get('orderId');

  const { data: cafeTables = [], isLoading: tablesLoading } = useCafeTables();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useAvailableProducts();
  const createOrderMutation = useCreateOrder();
  const addItemsMutation = useAddItemsToOrder();

  const table = cafeTables.find((tbl) => tbl.id === tableId);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [configProduct, setConfigProduct] = useState<Product | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'menu' | 'order'>('menu');

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const handleAddProduct = useCallback((product: Product) => {
    // Check if product needs options
    if (product.hasSugar || (product.options && product.options.length > 0)) {
      setConfigProduct(product);
      setIsOptionsOpen(true);
      return;
    }

    setOrderItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}`,
          productId: product.id,
          productName: t(product.nameEn, product.nameFr, product.nameAr || product.nameEn),
          quantity: 1,
          unitPrice: product.price,
        },
      ];
    });
  }, []);

  const handleAddProductWithOptions = useCallback((options: { selectedOptions: string[]; sugar: number }) => {
    if (!configProduct) return;

    setOrderItems((prev) => {
      // For items with options, we usually want separate entries unless all options match.
      // For simplicity, let's treat every "options" call as a new entry if options differ.
      // But user didn't specify, so let's just add it as a new item for now.
      return [
        ...prev,
        {
          id: `item-${Date.now()}`,
          productId: configProduct.id,
          productName: t(configProduct.nameEn, configProduct.nameFr, configProduct.nameAr || configProduct.nameEn),
          quantity: 1,
          unitPrice: configProduct.price,
          selectedOptions: options.selectedOptions,
          sugar: options.sugar,
        },
      ];
    });
    setConfigProduct(null);
  }, [configProduct]);

  const handleUpdateQuantity = useCallback((itemId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const handleSendOrder = useCallback(async () => {
    if (!tableId || orderItems.length === 0) return;

    const items = orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes,
      selectedOptions: item.selectedOptions,
      sugar: item.sugar,
    }));

    try {
      // Prioritize explicit orderId from URL
      if (orderId) {
        await addItemsMutation.mutateAsync({
          orderId: orderId,
          items
        });
        toast.success(t('Items added successfully!', 'Articles ajoutés avec succès!', 'تم إضافة الأصناف بنجاح!'));
      }
      // Fallback to table status check (fixing the 'ordered' status bug)
      else if (table?.currentOrder && ['new', 'ordered'].includes(table.status)) {
        // Double check order status matches
        const status = (table.currentOrder as any).status;
        if (status === 'new') {
          await addItemsMutation.mutateAsync({
            orderId: table.currentOrder.id,
            items
          });
          toast.success(t('Items added successfully!', 'Articles ajoutés avec succès!', 'تم إضافة الأصناف بنجاح!'));
        } else {
          // Safe fallback if status mismatch
          await createOrderMutation.mutateAsync({ tableId, items });
          toast.success(t('Order sent successfully!', 'Commande envoyée avec succès!', 'تم إرسال الطلب بنجاح!'));
        }
      } else {
        await createOrderMutation.mutateAsync({ tableId, items });
        toast.success(t('Order sent successfully!', 'Commande envoyée avec succès!', 'تم إرسال الطلب بنجاح!'));
      }
      navigate(`/tables/${tableId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to send order', 'Échec de l\'envoi', 'فشل إرسال الطلب'));
    }
  }, [tableId, orderId, orderItems, createOrderMutation, addItemsMutation, table, navigate, t]);

  if (tablesLoading || !tableId) {
    const table = cafeTables.find((tbl) => tbl.id === tableId);
    if (!table && !tablesLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              {t('Please select a table first', "Veuillez d'abord sélectionner une table", "يرجى اختيار طاولة أولاً")}
            </p>
            <Button variant="link" onClick={() => navigate('/tables')} className="mt-2">
              {t('Go to tables', 'Aller aux tables', 'الذهاب إلى الطاولات')}
            </Button>
          </div>
        </div>
      );
    }
  }

  if (!table) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            {t('Please select a table first', "Veuillez d'abord sélectionner une table", "يرجى اختيار طاولة أولاً")}
          </p>
          <Button variant="link" onClick={() => navigate('/tables')} className="mt-2">
            {t('Go to tables', 'Aller aux tables', 'الذهاب إلى الطاولات')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Mobile Header & Tabs */}
      <div className="lg:hidden space-y-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tables')} className="w-fit p-0 h-auto">
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
          {t('Back to tables', 'Retour aux tables', 'العودة إلى الطاولات')}
        </Button>

        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setMobileTab('menu')}
            className={`py-2 text-sm font-medium rounded-md transition-all ${mobileTab === 'menu'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
              }`}
          >
            {t('Menu', 'Menu', 'القائمة')}
          </button>
          <button
            onClick={() => setMobileTab('order')}
            className={`py-2 text-sm font-medium rounded-md transition-all relative ${mobileTab === 'order'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
              }`}
          >
            {t('Order', 'Commande', 'الطلب')}
            {orderItems.length > 0 && (
              <span className="absolute top-1 end-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <Button variant="ghost" onClick={() => navigate('/tables')}>
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
          {t('Back to tables', 'Retour aux tables', 'العودة إلى الطاولات')}
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 gap-4 overflow-hidden lg:flex-row">
        {/* Product Section */}
        <div className={`flex flex-1 gap-4 overflow-hidden ${mobileTab === 'order' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="hidden w-56 shrink-0 overflow-auto lg:block">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t('Categories', 'Catégories', 'الأصناف')}
            </h2>
            {categoriesLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <CategorySidebar
                categories={categories}
                selectedId={selectedCategory}
                onSelect={setSelectedCategory}
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mb-4 flex gap-2 overflow-auto lg:hidden">
              <button
                onClick={() => setSelectedCategory('')}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}
              >
                {t('All', 'Tout', 'الكل')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    }`}
                >
                  {t(cat.nameEn, cat.nameFr, cat.nameAr || cat.nameEn)}
                </button>
              ))}
            </div>

            {productsLoading ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] pb-20 lg:pb-0">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleAddProduct(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Panel Section */}
        <div className={`h-full w-full lg:w-96 ${mobileTab === 'menu' ? 'hidden lg:block' : 'block'}`}>
          <OrderPanel
            items={orderItems}
            tableNumber={table.number}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onSendOrder={handleSendOrder}
          />
        </div>
      </div>

      {configProduct && (
        <ProductOptionsDialog
          open={isOptionsOpen}
          onOpenChange={setIsOptionsOpen}
          product={configProduct}
          onConfirm={handleAddProductWithOptions}
        />
      )}
    </div>
  );
};

export default NewOrder;
