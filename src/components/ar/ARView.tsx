"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, Maximize2, Info } from "lucide-react";

interface ARViewProps {
  onCapture?: (file: File) => void;
}

export default function ARView({ onCapture }: ARViewProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startAR = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

    } catch (err) {
      console.error("Erreur caméra AR:", err);
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const stopAR = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !onCapture) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "ar-capture.jpg", { type: "image/jpeg" });
          onCapture(file);
        }
      }, "image/jpeg", 0.9);
    }
  };

  return (
    <div className="herbarium-card rounded-xl overflow-hidden">
      {!isActive ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full border border-border bg-paper flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-serif font-semibold text-foreground mb-2">
            Mode Réalité Augmentée
          </h3>
          <p className="text-sm text-foreground/60 mb-4 max-w-md mx-auto">
            Cadrez une plante, puis capturez-la pour lancer la même analyse IA que l&apos;outil photo.
          </p>
          <button
            onClick={startAR}
            className="herbarium-button herbarium-button-primary"
          >
            <Maximize2 className="w-4 h-4" />
            Activer la caméra AR
          </button>
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-[500px] object-cover"
          />

          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <button
              onClick={stopAR}
              className="herbarium-button bg-terracotta text-white border-terracotta"
            >
              <X className="w-4 h-4" />
              Fermer AR
            </button>
            <button
              onClick={captureFrame}
              className="herbarium-button herbarium-button-primary"
            >
              <Camera className="w-4 h-4" />
              Capturer
            </button>
          </div>

          <div className="absolute top-4 right-4">
            <div className="herbarium-label animate-pulse">
              <Info className="w-3 h-3" />
              Prêt à analyser
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
