
import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  aspectRatio: number;
  onCropComplete: (croppedImageUrl: string) => void;
  onRemove: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUrl,
  aspectRatio,
  onCropComplete,
  onRemove
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (imageLoaded && aspectRatio > 0) {
      cropImage();
    }
  }, [imageLoaded, aspectRatio]);

  const cropImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { naturalWidth, naturalHeight } = image;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = naturalWidth;
    let sourceHeight = naturalHeight;

    if (aspectRatio > 0) {
      const imageAspectRatio = naturalWidth / naturalHeight;
      
      if (imageAspectRatio > aspectRatio) {
        // Image is wider than target ratio, crop horizontally
        sourceWidth = naturalHeight * aspectRatio;
        sourceX = (naturalWidth - sourceWidth) / 2;
      } else {
        // Image is taller than target ratio, crop vertically
        sourceHeight = naturalWidth / aspectRatio;
        sourceY = (naturalHeight - sourceHeight) / 2;
      }
    }

    // Set canvas dimensions based on aspect ratio
    const maxWidth = 800;
    const maxHeight = aspectRatio > 0 ? maxWidth / aspectRatio : (maxWidth * naturalHeight) / naturalWidth;
    
    canvas.width = aspectRatio > 0 ? maxWidth : naturalWidth;
    canvas.height = aspectRatio > 0 ? maxHeight : naturalHeight;

    // Draw the cropped image
    ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(croppedUrl);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const displayRatio = aspectRatio > 0 ? aspectRatio : 4/5; // Default to 4:5 for original

  return (
    <div className="relative">
      <AspectRatio ratio={displayRatio}>
        <div className="relative w-full h-full bg-gray-100 rounded-md overflow-hidden">
          <img 
            src={imageUrl}
            alt="Crop preview"
            className="w-full h-full object-cover"
            style={{
              objectPosition: 'center'
            }}
          />
        </div>
      </AspectRatio>
      
      {/* Hidden elements for processing */}
      <img
        ref={imageRef}
        src={imageUrl}
        onLoad={handleImageLoad}
        className="hidden"
        alt="Source"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
