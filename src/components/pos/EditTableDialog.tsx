import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { CafeTable } from '@/types';

interface EditTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: CafeTable | null;
    onSubmit: (data: { id: string; number: number; name: string; capacity?: number }) => void;
    isLoading?: boolean;
}

export const EditTableDialog = ({
    open,
    onOpenChange,
    table,
    onSubmit,
    isLoading,
}: EditTableDialogProps) => {
    const { t } = useApp();
    const [number, setNumber] = useState<string>('');
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState<string>('');

    useEffect(() => {
        if (table) {
            setNumber(table.number.toString());
            setName(table.name);
            setCapacity(table.capacity.toString());
        }
    }, [table]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!table) return;

        onSubmit({
            id: table.id,
            number: parseInt(number, 10),
            name,
            capacity: capacity ? parseInt(capacity, 10) : undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {t('Edit Table', 'Modifier la table', 'تعديل الطاولة')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-number">{t('Table Number', 'Numéro de table', 'رقم الطاولة')}</Label>
                        <Input
                            id="edit-number"
                            type="number"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            required
                            min="1"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">{t('Name/Label', 'Nom/Étiquette', 'اسم/العلامة')}</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('e.g. Table 5, Terrace 1', 'ex: Table 5, Terrasse 1', 'مثال: طاولة 1')}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-capacity">{t('Capacity', 'Capacité', 'السعة')}</Label>
                        <Input
                            id="edit-capacity"
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            min="1"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            {t('Cancel', 'Annuler', 'إلغاء')}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('Saving...', 'Enregistrement...', 'حفظ...') : t('Save Changes', 'Enregistrer', 'حفظ التغييرات')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
