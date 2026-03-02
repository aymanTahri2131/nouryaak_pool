import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    disabled?: boolean;
    className?: string;
}

export function ImageUpload({ value, onChange, onRemove, disabled, className }: ImageUploadProps) {
    const { t } = useApp();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error(t('Please select an image file', 'Veuillez sélectionner une image', 'الرجاء تحديد ملف صورة'));
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error(t('Image must be less than 5MB', 'L\'image doit faire moins de 5 Mo', 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت'));
            return;
        }

        try {
            setIsUploading(true);

            // Fetch from env or hardcode for now (replace with actual values)
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'doq0mdnkz'; // Using a placeholder or the provided one if available
            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset'; // Replace with actual preset

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error('Cloudinary upload error:', errData);
                throw new Error(errData.error?.message || 'Upload failed');
            }

            const data = await response.json();
            onChange(data.secure_url);
            toast.success(t('Image uploaded successfully', 'Image téléchargée avec succès', 'تم رفع الصورة بنجاح'));
        } catch (error) {
            console.error('Upload Error:', error);
            toast.error('Failed to upload image. Please check Cloudinary credentials.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    return (
        <div className={`space-y-4 w-full flex flex-col items-center ${className || ''}`}>
            <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/20 overflow-hidden group">
                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 hover:text-white"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (onRemove) {
                                            onRemove();
                                        } else {
                                            onChange('');
                                        }
                                    }}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Camera className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-xs uppercase font-medium tracking-wider">Avatar</span>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
            </div>

            <div className="flex justify-center">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                >
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <UploadCloud className="h-4 w-4" />
                    )}
                    {value ? t('Change Avatar', 'Changer l\'avatar', 'تغيير الصورة') : t('Upload Avatar', 'Uploader un avatar', 'رفع صورة')}
                </Button>
            </div>
        </div>
    );
}
