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
import { Textarea } from '@/components/ui/textarea';
import { Category } from '@/types';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useProducts';
import { toast } from 'sonner';

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null;
}

export const CategoryDialog = ({ open, onOpenChange, category }: CategoryDialogProps) => {
    const { t } = useApp();
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();

    const [nameEn, setNameEn] = useState('');
    const [nameFr, setNameFr] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (category) {
            setNameEn(category.nameEn);
            setNameFr(category.nameFr);
            setNameAr(category.nameAr || '');
            setDescription(category.description || '');
        } else {
            resetForm();
        }
    }, [category, open]);

    const resetForm = () => {
        setNameEn('');
        setNameFr('');
        setNameAr('');
        setDescription('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (category) {
                await updateCategoryMutation.mutateAsync({
                    id: category.id,
                    data: { nameEn, nameFr, nameAr, description },
                });
                toast.success(t('Category updated', 'Catégorie mise à jour', 'تم تحديث الصنف'));
            } else {
                await createCategoryMutation.mutateAsync({
                    nameEn,
                    nameFr,
                    nameAr,
                    description,
                });
                toast.success(t('Category created', 'Catégorie créée', 'تم إنشاء الصنف'));
            }
            onOpenChange(false);
            resetForm();
        } catch (err) {
            toast.error(t('Failed to save category', 'Erreur lors de la sauvegarde', 'فشل حفظ الصنف'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {category ? t('Edit Category', 'Modifier la catégorie', 'تعديل الصنف') : t('New Category', 'Nouvelle catégorie', 'صنف جديد')}
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
                        <Label htmlFor="description">{t('Description', 'Description', 'الوصف')}</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">
                            {category ? t('Update', 'Mettre à jour', 'تحديث') : t('Create', 'Créer', 'إنشاء')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
