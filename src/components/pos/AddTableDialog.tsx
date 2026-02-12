import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';

interface AddTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { number: number; name: string; capacity?: number }) => Promise<void>;
    isLoading?: boolean;
}

export function AddTableDialog({ open, onOpenChange, onSubmit, isLoading }: AddTableDialogProps) {
    const { t } = useApp();
    const [formData, setFormData] = useState({
        number: '',
        name: '',
        capacity: '4',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.number) {
            newErrors.number = t('Number is required', 'Le numéro est requis', 'رقم الطاولة مطلوب');
        } else if (isNaN(parseInt(formData.number)) || parseInt(formData.number) < 1) {
            newErrors.number = t('Invalid number', 'Numéro invalide', 'رقم الطاولة غير صحيح');
        }

        if (!formData.name.trim()) {
            newErrors.name = t('Name is required', 'Le nom est requis', 'اسم الطاولة مطلوب');
        }

        if (formData.capacity && (isNaN(parseInt(formData.capacity)) || parseInt(formData.capacity) < 1)) {
            newErrors.capacity = t('Invalid capacity', 'Capacité invalide', 'السعة غير صحيحة');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        await onSubmit({
            number: parseInt(formData.number),
            name: formData.name,
            capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        });

        // Reset form on success (the parent component will close the dialog)
        setFormData({ number: '', name: '', capacity: '4' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('Add New Table', 'Ajouter une nouvelle table', 'إضافة طاولة جديدة')}</DialogTitle>
                    <DialogDescription>
                        {t('Enter table details below.', 'Entrez les détails de la table ci-dessous.', 'أدخل التفاصيل للطاولة أدناه')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="number">{t('Table Number', 'Numéro de table', 'رقم الطاولة')} <span className="text-destructive">*</span></Label>
                        <Input
                            id="number"
                            type="number"
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            placeholder="1"
                            disabled={isLoading}
                        />
                        {errors.number && <p className="text-sm text-destructive">{errors.number}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">{t('Table Name', 'Nom de la table', 'اسم الطاولة')} <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('e.g., Window 1', 'ex: Fenêtre 1', 'مثال: طاولة 1')}
                            disabled={isLoading}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="capacity">{t('Capacity', 'Capacité', 'السعة')}</Label>
                        <Input
                            id="capacity"
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            placeholder="4"
                            disabled={isLoading}
                        />
                        {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            {t('Cancel', 'Annuler', 'إلغاء')}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('Creating...', 'Création...', 'إنشاء...') : t('Create Table', 'Créer la table', 'إنشاء طاولة')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
