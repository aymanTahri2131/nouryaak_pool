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
import { PoolTable } from '@/types';
import { useCreatePoolTable, useUpdatePoolTable } from '@/hooks/usePoolTables';
import { toast } from 'sonner';

interface PoolTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table?: PoolTable | null;
}

export const PoolTableDialog = ({ open, onOpenChange, table }: PoolTableDialogProps) => {
    const { t } = useApp();
    const createMutation = useCreatePoolTable();
    const updateMutation = useUpdatePoolTable();

    const [number, setNumber] = useState('');
    const [name, setName] = useState('');
    const [pricePerPiece, setPricePerPiece] = useState('');

    useEffect(() => {
        if (table) {
            setNumber(table.number.toString());
            setName(table.name);
            setPricePerPiece(table.pricePerPiece.toString());
        } else {
            setNumber('');
            setName('');
            setPricePerPiece('1.00');
        }
    }, [table, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (table) {
                await updateMutation.mutateAsync({
                    id: table.id,
                    data: {
                        number: parseInt(number),
                        name,
                        pricePerPiece: parseFloat(pricePerPiece),
                    },
                });
                toast.success(t('Pool table updated', 'Table de billard mise à jour', 'تم تحديث طاولة البلياردو'));
            } else {
                await createMutation.mutateAsync({
                    number: parseInt(number),
                    name,
                    pricePerPiece: parseFloat(pricePerPiece),
                });
                toast.success(t('Pool table created', 'Table de billard créée', 'تم إنشاء طاولة البلياردو'));
            }
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('Failed to save table', 'Échec de la sauvegarde', 'فشل الحفظ'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {table ? t('Edit Pool Table', 'Modifier la table', 'تعديل طاولة البلياردو') : t('New Pool Table', 'Nouvelle table', 'إضافة طاولة البلياردو')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="number">{t('Table Number', 'Numéro de table', 'رقم الطاولة')}</Label>
                        <Input
                            id="number"
                            type="number"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('Name', 'Nom', 'اسم الطاولة')}</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. VIP Table"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price">{t('Price Per Piece (DH)', 'Prix par pièce (DH)', 'سعر القطعة (درهم)')}</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={pricePerPiece}
                            onChange={(e) => setPricePerPiece(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {table ? t('Update', 'Mettre à jour', 'تحديث') : t('Create', 'Créer', 'إنشاء')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
