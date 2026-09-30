"use client";
/* eslint-disable @next/next/no-img-element -- image previews come from local FileReader data URLs */

import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X } from "lucide-react";

interface PhotoUploadProps {
  onImageUpload: (file: File) => void;
  isLoading?: boolean;
  onPreviewChange?: (preview: string | null) => void;
}

export default function PhotoUpload({ onImageUpload, isLoading, onPreviewChange }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onPreviewChange?.(dataUrl);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  }, [onImageUpload, onPreviewChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
        "image/jpeg": [".jpeg", ".jpg"],
        "image/png": [".png"],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const clearImage = () => {
    setPreview(null);
    setUseCamera(false);
    onPreviewChange?.(null);
  };

  const handleCameraClick = () => {
    setUseCamera(true);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onPreviewChange?.(dataUrl);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`relative border border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 bg-paper ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary hover:bg-primary/5"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border border-border bg-white flex items-center justify-center">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground mb-1">
                {isDragActive
                  ? "Déposez votre image ici"
                  : "Photographiez ou importez un organisme vivant"}
              </p>
              <p className="text-sm text-foreground/60">
                Formats acceptés : JPEG, PNG (10 Mo maximum)
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <button
                type="button"
                className="herbarium-button herbarium-button-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCameraClick();
                }}
              >
                <Camera className="w-4 h-4" />
                Prendre une photo
              </button>
              <button
                type="button"
                className="herbarium-button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="w-4 h-4" />
                Choisir un fichier
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture={useCamera ? "environment" : undefined}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border bg-paper">
          {/* Local FileReader data URLs are intentionally rendered without the image optimizer. */}
          <img
            src={preview}
            alt="Aperçu de la plante"
            className="w-full h-80 object-cover"
          />
          {!isLoading && (
            <button
              onClick={clearImage}
              className="absolute top-3 right-3 w-9 h-9 border border-border bg-paper/90 hover:bg-paper rounded-full flex items-center justify-center text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-black/30">
              <div className="scan-line" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-paper/90 border border-border rounded-lg px-4 py-3 text-sm text-foreground">
                  Analyse en cours...
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
