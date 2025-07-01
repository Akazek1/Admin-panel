import Image from 'next/image';
import { Label } from './ui/label';

interface ImagePickerProps {
    onImageSelect?: (file: File) => void;
    initialPreview?: string | null;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ onImageSelect, initialPreview }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return;
        onImageSelect?.(file); // Preview handled by parent
    };

    return (
        <div className="w-full max-w-sm">
            <Label className="font-semibold text-secondary-foreground/50 text-xs">Service Image</Label>
            <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-44 p-4 border-2 border-dashed border-gray-300 bg-white rounded-lg cursor-pointer hover:border-[#145B10] transition"
            >
                {initialPreview ? (
                    <Image
                        width={400}
                        height={400}
                        src={initialPreview}
                        alt="Preview"
                        className="max-h-44 object-contain rounded"
                    />
                ) : (
                    <div className="text-center text-gray-500">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16l-4-4m0 0l4-4m-4 4h18"
                            />
                        </svg>
                        <p className="mt-2 text-[#145B10]">Click to upload or drag image</p>
                    </div>
                )}
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                />
            </label>
        </div>
    );
};


export default ImagePicker;