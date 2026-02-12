import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Product } from '@/types';
import { Minus, Plus } from 'lucide-react';

interface ProductOptionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    onConfirm: (options: { selectedOptions: string[]; sugar: number }) => void;
}

export const ProductOptionsDialog = ({
    open,
    onOpenChange,
    product,
    onConfirm,
}: ProductOptionsDialogProps) => {
    const { t } = useApp();
    const [sugar, setSugar] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const handleToggleOption = (option: string) => {
        setSelectedOptions(prev =>
            prev.includes(option)
                ? prev.filter(o => o !== option)
                : [...prev, option]
        );
    };

    const handleConfirm = () => {
        onConfirm({ selectedOptions, sugar });
        onOpenChange(false);
        // Reset state for next time
        setSugar(0);
        setSelectedOptions([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Sugar Selection */}
                    {product.hasSugar && (
                        <div className="space-y-2">
                            <Label className="text-base font-semibold">{t('Sugar Level', 'Niveau de sucre', 'مستوى السكر')}</Label>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSugar(Math.max(0, sugar - 1))}
                                    disabled={sugar <= 0}
                                    className="h-10 w-10"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-xl font-bold w-8 text-center">{sugar}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSugar(sugar + 1)}
                                    className="h-10 w-10"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Options Selection */}
                    {product.options && product.options.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-base font-semibold">{t('Options', 'Options', 'خيارات')}</Label>
                            <div className="flex flex-wrap gap-2">
                                {product.options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleToggleOption(option)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${selectedOptions.includes(option)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleConfirm} className="w-full sm:w-auto">
                        {t('Add to Order', 'Ajouter à la commande', 'إضافة إلى الطلب')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
