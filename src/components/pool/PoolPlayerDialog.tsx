import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/contexts/AppContext';
import { PoolPlayer, CreatePoolPlayerInput, UpdatePoolPlayerInput } from '@/apis/poolPlayers.api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

const playerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    avatarUrl: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface PoolPlayerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    player?: PoolPlayer | null;
    onSubmit: (data: CreatePoolPlayerInput | UpdatePoolPlayerInput) => void;
    isLoading?: boolean;
}

export function PoolPlayerDialog({
    open,
    onOpenChange,
    player,
    onSubmit,
    isLoading = false,
}: PoolPlayerDialogProps) {
    const { t } = useApp();
    const isEditing = !!player;

    const form = useForm<PlayerFormValues>({
        resolver: zodResolver(playerSchema),
        defaultValues: {
            name: '',
            avatarUrl: 'https://res.cloudinary.com/doq0mdnkz/image/upload/v1772425099/gsekayy2xtsfratohk3q.png',
        },
    });

    useEffect(() => {
        if (open) {
            if (player) {
                form.reset({
                    name: player.name,
                    avatarUrl: player.avatarUrl || 'https://res.cloudinary.com/doq0mdnkz/image/upload/v1772425099/gsekayy2xtsfratohk3q.png',
                });
            } else {
                form.reset({
                    name: '',
                    avatarUrl: 'https://res.cloudinary.com/doq0mdnkz/image/upload/v1772425099/gsekayy2xtsfratohk3q.png',
                });
            }
        }
    }, [open, player, form]);

    const handleSubmit = (values: PlayerFormValues) => {
        onSubmit(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? t('Edit Pool Player', 'Modifier le joueur', 'تعديل لاعب البلياردو')
                            : t('Add Pool Player', 'Ajouter un joueur', 'إضافة لاعب بلياردو')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="avatarUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            onRemove={() => field.onChange('')}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('Name', 'Nom', 'الاسم')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("Player name", "Nom du joueur", "اسم اللاعب")}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                {t('Cancel', 'Annuler', 'إلغاء')}
                            </Button>
                            <Button type="submit" disabled={isLoading} className="gap-2">
                                <Save className="h-4 w-4" />
                                {isLoading
                                    ? t('Saving...', 'Enregistrement...', 'جاري الحفظ...')
                                    : t('Save', 'Enregistrer', 'حفظ')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
