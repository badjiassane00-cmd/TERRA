"use client";
/* eslint-disable @next/next/no-img-element -- image previews come from local FileReader data URLs */

import { useCallback, useState, useRef } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { Camera, Upload, X } from "lucide-react";
import { acceptedIdentificationImageTypes, MAX_IDENTIFICATION_IMAGE_BYTES, type IdentificationImageMode, type IdentificationImageType, validateIdentificationImage } from "@/lib/identification-image";

interface PhotoUploadProps {
  onImageUpload: (file: File) => void;
  isLoading?: boolean;
  onPreviewChange?: (preview: string | null) => void;
  mode?: IdentificationImageMode;
}

const EXTENSIONS: Record<IdentificationImageType, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export default function PhotoUpload({ onImageUpload, isLoading, onPreviewChange, mode = "plants" }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptedImageTypes = acceptedIdentificationImageTypes(mode);
  const accept = acceptedImageTypes.reduce<Accept>((types, type) => {
    types[type] = EXTENSIONS[type];
    return types;
  }, {});

  const uploadFile = useCallback((file: File) => {
    const validation = validateIdentificationImage(file, mode);
    if (validation) {
      setFileError(validation.message);
      return;
    }
    setFileError("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onPreviewChange?.(dataUrl);
    };
    reader.readAsDataURL(file);
    onImageUpload(file);
  }, [mode, onImageUpload, onPreviewChange]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (!rejection) return;
      if (rejection.errors.some((error) => error.code === "too-many-files")) {
        setFileError("Choisissez une seule image à la fois.");
        return;
      }
      setFileError(validateIdentificationImage(rejection.file, mode)?.message || "Cette image ne peut pas être utilisée.");
    },
    accept,
    maxSize: MAX_IDENTIFICATION_IMAGE_BYTES,
    maxFiles: 1,
    disabled: isLoading,
  });

  const clearImage = () => {
    setPreview(null);
    setUseCamera(false);
    setFileError("");
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
    if (file) uploadFile(file);
    e.currentTarget.value = "";
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
                Formats acceptés : {acceptedImageTypes.map((type) => EXTENSIONS[type][0].replace(".", "").toUpperCase()).join(", ")} (10 Mo maximum)
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
            {fileError && <p className="mt-3 text-sm text-terracotta" role="alert">{fileError}</p>}
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border bg-paper">
          {/* Local FileReader data URLs are intentionally rendered without the image optimizer. */}
          <img
            src={preview}
            alt="Aperçu de la photo choisie"
            className="w-full h-80 bg-paper-dark object-contain"
          />
          {!isLoading && (
            <button
              type="button"
              aria-label="Retirer la photo"
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
      {preview && fileError && <p className="mt-3 text-sm text-terracotta" role="alert">{fileError}</p>}
    </div>
  );
}
