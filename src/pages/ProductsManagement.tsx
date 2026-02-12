import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  useProducts,
  useCategories,
  useToggleProductAvailability,
  useDeleteProduct,
  useDeleteCategory
} from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, Category } from '@/types';
import { toast } from 'sonner';
import { Package, FolderOpen, Edit, Trash2, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductDialog } from '@/components/pos/ProductDialog';
import { CategoryDialog } from '@/components/pos/CategoryDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ProductsManagement = () => {
  const { t } = useApp();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const toggleAvailabilityMutation = useToggleProductAvailability();
  const deleteProductMutation = useDeleteProduct();
  const deleteCategoryMutation = useDeleteCategory();

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedEditCategory, setSelectedEditCategory] = useState<Category | null>(null);

  // Delete confirmation states
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const handleToggleAvailability = async (product: Product) => {
    try {
      await toggleAvailabilityMutation.mutateAsync(product.id);
      toast.success(
        product.isAvailable
          ? t('Product marked as unavailable', 'Produit marqué comme indisponible', 'تم تحديد المنتج كغير متوفر')
          : t('Product marked as available', 'Produit marqué comme disponible', 'تم تحديد المنتج كمتوفر')
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to update', 'Échec de la mise à jour', 'فشل التحديث'));
    }
  };

  const handleDeleteProduct = async () => {
    if (!itemToDelete) return;
    try {
      await deleteProductMutation.mutateAsync(itemToDelete);
      toast.success(t('Product deleted', 'Produit supprimé', 'تم حذف المنتج'));
      setDeleteProductOpen(false);
      setItemToDelete(null);
    } catch (err) {
      toast.error(t('Failed to delete product', 'Échec de la suppression', 'فشل حذف المنتج'));
    }
  };

  const handleDeleteCategory = async () => {
    if (!itemToDelete) return;
    try {
      await deleteCategoryMutation.mutateAsync(itemToDelete);
      toast.success(t('Category deleted', 'Catégorie supprimée', 'تم حذف الصنف'));
      setDeleteCategoryOpen(false);
      setItemToDelete(null);
    } catch (err) {
      toast.error(t('Failed to delete category', 'Échec de la suppression', 'فشل حذف الصنف'));
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('Products Management', 'Gestion des Produits', 'إدارة المنتجات')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('Manage menu items and prices', 'Gérer les articles et les prix', 'إدارة قائمة الطعام والأسعار')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            {t('Products', 'Produits', 'المنتجات')}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            {t('Categories', 'Catégories', 'الأصناف')}
          </TabsTrigger>
        </TabsList>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('')}
                size="sm"
              >
                {t('All', 'Tout', 'الكل')}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.id)}
                  size="sm"
                >
                  {t(cat.nameEn, cat.nameFr, cat.nameAr || cat.nameEn)}
                </Button>
              ))}
            </div>

            <Button onClick={() => { setSelectedProduct(null); setProductDialogOpen(true); }}>
              <Plus className="me-2 h-4 w-4" />
              {t('Add Product', 'Ajouter Produit', 'إضافة منتج')}
            </Button>
          </div>

          {productsLoading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_100px_100px_100px] gap-4 border-b bg-secondary/50 px-6 py-4 text-sm font-semibold text-muted-foreground">
                <div>{t('Product', 'Produit', 'المنتج')}</div>
                <div>{t('Category', 'Catégorie', 'الصنف')}</div>
                <div className="text-end">{t('Price', 'Prix', 'السعر')}</div>
                <div className="text-center">{t('Available', 'Disponible', 'متوفر')}</div>
                <div className="text-end">{t('Actions', 'Actions', 'الإجراءات')}</div>
              </div>

              <div className="divide-y">
                {filteredProducts.map((product) => {
                  const category = categories.find((c) => c.id === product.categoryId);

                  return (
                    <div
                      key={product.id}
                      className="grid grid-cols-[1fr_120px_100px_100px_100px] gap-4 px-6 py-4 items-center"
                    >
                      <div>
                        <p className="font-medium text-foreground">{t(product.nameEn, product.nameFr, product.nameAr || product.nameEn)}</p>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">{category ? t(category.nameEn, category.nameFr, category.nameAr || category.nameEn) : '-'}</div>
                      <div className="text-end">
                        <span className="font-medium">
                          {product.price.toFixed(2)} DH
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <Switch
                          checked={product.isAvailable}
                          onCheckedChange={() => handleToggleAvailability(product)}
                          disabled={toggleAvailabilityMutation.isPending}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedProduct(product); setProductDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setItemToDelete(product.id); setDeleteProductOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setSelectedEditCategory(null); setCategoryDialogOpen(true); }}>
              <Plus className="me-2 h-4 w-4" />
              {t('Add Category', 'Ajouter Catégorie', 'إضافة صنف')}
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_1fr_100px_100px] gap-4 border-b bg-secondary/50 px-6 py-4 text-sm font-semibold text-muted-foreground">
                <div>{t('Name (EN)', 'Nom (EN)', 'الاسم (الإنجليزية)')}</div>
                <div>{t('Name (FR)', 'Nom (FR)', 'الاسم (الفرنسية)')}</div>
                <div>{t('Name (AR)', 'Nom (AR)', 'الاسم (العربية)')}</div>
                <div className="text-center">{t('Products', 'Produits', 'المنتجات')}</div>
                <div className="text-end">{t('Actions', 'Actions', 'الإجراءات')}</div>
              </div>

              <div className="divide-y">
                {categories.map((category) => {
                  const productCount = products.filter((p) => p.categoryId === category.id).length;

                  return (
                    <div
                      key={category.id}
                      className="grid grid-cols-[1fr_1fr_1fr_100px_100px] gap-4 px-6 py-4 items-center"
                    >
                      <div className="font-medium text-foreground">{category.nameEn}</div>
                      <div className="text-muted-foreground">{category.nameFr}</div>
                      <div className="text-muted-foreground font-arabic" dir="rtl">{category.nameAr || '-'}</div>
                      <div className="text-center text-muted-foreground">{productCount}</div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedEditCategory(category); setCategoryDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setItemToDelete(category.id); setDeleteCategoryOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
        categories={categories}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedEditCategory}
      />

      {/* Confirmation Dialogs */}
      <AlertDialog open={deleteProductOpen} onOpenChange={setDeleteProductOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete Product?', 'Supprimer le produit ?', 'حذف المنتج؟')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('This action cannot be undone.', 'Cette action est irréversible.', 'لا يمكن التراجع عن هذا الإجراء.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'Annuler', 'إلغاء')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              {t('Delete', 'Supprimer', 'حذف')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCategoryOpen} onOpenChange={setDeleteCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete Category?', 'Supprimer la catégorie ?', 'حذف الصنف؟')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('This might affect existing orders.', 'Cela pourrait affecter les commandes existantes.', 'قد يؤثر هذا على الطلبات الموجودة.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'Annuler', 'إلغاء')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
              {t('Delete', 'Supprimer', 'حذف')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ProductsManagement;
