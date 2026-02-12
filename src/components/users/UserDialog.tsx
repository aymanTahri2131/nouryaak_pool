import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import type { User } from '@/types';
import type { CreateUserInput, UpdateUserInput } from '@/apis/users.api';

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null;
    onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
    isLoading?: boolean;
}

export function UserDialog({ open, onOpenChange, user, onSubmit, isLoading }: UserDialogProps) {
    const { t } = useApp();
    const isEdit = !!user;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'waiter' as 'admin' | 'waiter' | 'bartender' | 'pool_manager',
        pin: '',
        avatar: '',
        isActive: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                pin: user.pin || '',
                avatar: user.avatar || '',
                isActive: user.isActive,
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'waiter',
                pin: '',
                avatar: '',
                isActive: true,
            });
        }
        setErrors({});
    }, [user, open]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = t('Name is required', 'Le nom est requis', 'الاسم مطلوب');
        } else if (formData.name.trim().length < 2) {
            newErrors.name = t('Name must be at least 2 characters', 'Le nom doit contenir au moins 2 caractères', 'يجب أن يكون الاسم حرفين على الأقل');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('Email is required', 'L\'email est requis', 'البريد الإلكتروني مطلوب');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('Invalid email format', 'Format d\'email invalide', 'تنسيق بريد إلكتروني غير صالح');
        }

        if (!isEdit && !formData.password) {
            newErrors.password = t('Password is required', 'Le mot de passe est requis', 'كلمة المرور مطلوبة');
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = t('Password must be at least 6 characters', 'Le mot de passe doit contenir au moins 6 caractères', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
        }

        if (formData.pin && !/^\d{4}$/.test(formData.pin)) {
            newErrors.pin = t('PIN must be exactly 4 digits', 'Le PIN doit être exactement 4 chiffres', 'يجب أن يكون رمز PIN 4 أرقام بالضبط');
        }

        if (formData.avatar && !/^https?:\/\/.+/.test(formData.avatar)) {
            newErrors.avatar = t('Avatar must be a valid URL', 'L\'avatar doit être une URL valide', 'يجب أن يكون الرابط صالحاً للصورة');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const submitData: CreateUserInput | UpdateUserInput = isEdit
            ? {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                ...(formData.password && { password: formData.password }),
                role: formData.role,
                pin: formData.pin || null,
                avatar: formData.avatar || null,
                isActive: formData.isActive,
            }
            : {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: formData.role,
                ...(formData.pin && { pin: formData.pin }),
                ...(formData.avatar && { avatar: formData.avatar }),
            };

        await onSubmit(submitData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('Edit User', 'Modifier l\'utilisateur', 'تعديل المستخدم') : t('Create New User', 'Créer un nouvel utilisateur', 'إنشاء مستخدم جديد')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? t('Update user information below', 'Mettre à jour les informations de l\'utilisateur ci-dessous', 'تحديث معلومات المستخدم أدناه')
                            : t('Fill in the details to create a new user', 'Remplissez les détails pour créer un nouvel utilisateur', 'املأ التفاصيل لإنشاء مستخدم جديد')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            {t('Name', 'Nom', 'الاسم')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('Enter name', 'Entrez le nom', 'أدخل الاسم')}
                            disabled={isLoading}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">
                            {t('Email', 'Email', 'البريد الإلكتروني')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={t('Enter email', 'Entrez l\'email', 'أدخل البريد الإلكتروني')}
                            disabled={isLoading}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {t('Password', 'Mot de passe', 'كلمة المرور')} {!isEdit && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={isEdit ? t('Leave blank to keep current', 'Laisser vide pour conserver', 'اتركه فارغاً للحفاظ على الحالية') : t('Enter password', 'Entrez le mot de passe', 'أدخل كلمة المرور')}
                            disabled={isLoading}
                        />
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">
                            {t('Role', 'Rôle', 'الدور')} <span className="text-destructive">*</span>
                        </Label>
                        <Select value={formData.role} onValueChange={(value: typeof formData.role) => setFormData({ ...formData, role: value })} disabled={isLoading}>
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">{t('Admin', 'Administrateur', 'مدير')}</SelectItem>
                                <SelectItem value="waiter">{t('Waiter', 'Serveur', 'نادل')}</SelectItem>
                                <SelectItem value="bartender">{t('Bartender', 'Barman', 'بارمان')}</SelectItem>
                                <SelectItem value="pool_manager">{t('Pool Manager', 'Gestionnaire de billard', 'مدير البلياردو')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pin">{t('PIN (4 digits)', 'PIN (4 chiffres)', 'رمز PIN (4 أرقام)')}</Label>
                        <Input
                            id="pin"
                            value={formData.pin}
                            onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            placeholder="1234"
                            maxLength={4}
                            disabled={isLoading}
                        />
                        {errors.pin && <p className="text-sm text-destructive">{errors.pin}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="avatar">{t('Avatar URL', 'URL de l\'avatar', 'رابط الصورة الرمزية')}</Label>
                        <Input
                            id="avatar"
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            placeholder="https://example.com/avatar.jpg"
                            disabled={isLoading}
                        />
                        {errors.avatar && <p className="text-sm text-destructive">{errors.avatar}</p>}
                    </div>

                    {isEdit && (
                        <div className="flex items-center space-x-2">
                            <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} disabled={isLoading} />
                            <Label htmlFor="isActive">{t('Active', 'Actif', 'نشط')}</Label>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            {t('Cancel', 'Annuler', 'إلغاء')}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('Saving...', 'Enregistrement...', 'جاري الحفظ...') : isEdit ? t('Update', 'Mettre à jour', 'تحديث') : t('Create', 'Créer', 'إنشاء')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
