import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Product, Category } from '@/types';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    categories: Category[];
}

export const ProductDialog = ({ open, onOpenChange, product, categories }: ProductDialogProps) => {
    const { t } = useApp();
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();

    const [nameEn, setNameEn] = useState('');
    const [nameFr, setNameFr] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [hasSugar, setHasSugar] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [newOption, setNewOption] = useState('');

    useEffect(() => {
        if (product) {
            setNameEn(product.nameEn);
            setNameFr(product.nameFr);
            setNameAr(product.nameAr || '');
            setPrice(product.price.toString());
            setCategoryId(product.categoryId);
            setDescription(product.description || '');
            setHasSugar(product.hasSugar || false);
            setOptions(product.options || []);
        } else {
            resetForm();
        }
    }, [product, open]);

    const resetForm = () => {
        setNameEn('');
        setNameFr('');
        setNameAr('');
        setPrice('');
        setCategoryId('');
        setDescription('');
        setHasSugar(false);
        setOptions([]);
        setNewOption('');
    };

    const handleAddOption = () => {
        if (newOption.trim() && !options.includes(newOption.trim())) {
            setOptions([...options, newOption.trim()]);
            setNewOption('');
        }
    };

    const handleRemoveOption = (optionToRemove: string) => {
        setOptions(options.filter(o => o !== optionToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (product) {
                await updateProductMutation.mutateAsync({
                    id: product.id,
                    data: {
                        nameEn,
                        nameFr,
                        nameAr,
                        price: parseFloat(price),
                        categoryId,
                        description,
                        hasSugar,
                        options,
                    },
                });
                toast.success(t('Product updated', 'Produit mis à jour', 'تم تحديث المنتج'));
            } else {
                await createProductMutation.mutateAsync({
                    nameEn,
                    nameFr,
                    nameAr,
                    price: parseFloat(price),
                    categoryId,
                    description,
                    hasSugar,
                    options,
                });
                toast.success(t('Product created', 'Produit créé', 'تم إنشاء المنتج'));
            }
            onOpenChange(false);
            resetForm();
        } catch (err) {
            toast.error(t('Failed to save product', 'Erreur lors de la sauvegarde', 'فشل حفظ المنتج'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {product ? t('Edit Product', 'Modifier le produit', 'تعديل المنتج') : t('New Product', 'Nouveau produit', 'منتج جديد')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nameEn">{t('Name (EN)', 'Nom (EN)', 'الاسم (الإنجليزية)')}</Label>
                        <Input
                            id="nameEn"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nameFr">{t('Name (FR)', 'Nom (FR)', 'الاسم (الفرنسية)')}</Label>
                        <Input
                            id="nameFr"
                            value={nameFr}
                            onChange={(e) => setNameFr(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nameAr">{t('Name (AR)', 'Nom (AR)', 'الاسم (العربية)')}</Label>
                        <Input
                            id="nameAr"
                            value={nameAr}
                            onChange={(e) => setNameAr(e.target.value)}
                            required
                            className="text-end"
                            dir="rtl"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">{t('Category', 'Catégorie', 'الصنف')}</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} required>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select category', 'Sélectionner une catégorie', 'اختر صنفاً')} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {t(cat.nameEn, cat.nameFr, cat.nameAr || cat.nameEn)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price">{t('Price', 'Prix', 'السعر')}</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">{t('Description', 'Description', 'الوصف')}</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="hasSugar"
                            checked={hasSugar}
                            onChange={(e) => setHasSugar(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="hasSugar">{t('Enable Sugar Selection', 'Activer la sélection de sucre', 'تفعيل اختيار السكر')}</Label>
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('Product Options', 'Options du produit', 'خيارات المنتج')}</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                placeholder={t('Add option (e.g. Mint)', 'Ajouter une option (ex. Menthe)', 'إضافة خيار (مثلاً نعناع)')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddOption();
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddOption} variant="secondary">
                                {t('Add', 'Ajouter', 'إضافة')}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {options.map((option) => (
                                <div key={option} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                                    <span>{option}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(option)}
                                        className="ms-1 text-muted-foreground hover:text-destructive"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit">
                            {product ? t('Update', 'Mettre à jour', 'تحديث') : t('Create', 'Créer', 'إنشاء')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
