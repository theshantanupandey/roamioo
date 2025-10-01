
import React, { useState, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Image, X } from 'lucide-react';

interface ImageUploaderProps {
  onFileChange: (file: File | null) => void;
  onImageRemove?: () => void;
  initialImageUrl?: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileChange, onImageRemove, initialImageUrl }) => {
  const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    onFileChange(file);
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onFileChange(null);
    if(onImageRemove) onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-medium">Trip Image</label>
      {preview ? (
        <div className="relative group">
          <img src={preview} alt="Trip preview" className="w-full h-48 object-cover rounded-md" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex justify-center items-center w-full h-48 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Image className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Click to upload an image</p>
            <p className="text-xs text-gray-500">PNG or JPG</p>
          </div>
        </div>
      )}
      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png, image/jpeg"
        onChange={handleFileChange}
      />
    </div>
  );
};
