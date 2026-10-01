"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface PlantData {
  family?: string;
  description?: string;
  care?: {
    watering?: string;
    sunlight?: string;
    soil?: string;
  };
}

interface PredictionResult {
  className: string;
  scientificName: string;
  probability: number;
  confidence: "high" | "medium" | "low";
  plantData?: PlantData;
  source: string;
}

interface Candidate {
  name: string;
  scientificName: string;
  source: string;
  confidence: number;
  enrichedData?: PlantData;
}

export function usePlantRecognition() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trainingDataCount, setTrainingDataCount] = useState(0);

  const [showTrainingPanel, setShowTrainingPanel] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newScientificName, setNewScientificName] = useState("");
  const [plants, setPlants] = useState<Array<{ id: string; scientificName: string; commonNames: string[]; family: string | null; description: string | null }>>([]);
  const [trainingStats, setTrainingStats] = useState({ count: 0, species: 0 });
  const [trainingFeedback, setTrainingFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPlants = async () => {
    try {
      const response = await apiFetch("/api/plants/list");
      if (!response.ok) throw new Error("Réponse invalide de /api/plants/list");
      const data = await response.json();
      setPlants(data.plants || []);
    } catch (error) {
      console.error("Failed to load plants:", error);
    }
  };

  const fetchTrainingStats = async () => {
    try {
      const response = await apiFetch("/api/training");
      if (!response.ok) throw new Error("Réponse invalide de /api/training");
      const data = await response.json();
      setTrainingDataCount(data.count || 0);
      setTrainingStats({
        count: data.count || 0,
        species: data.species || 0,
      });
    } catch (error) {
      console.error("Failed to fetch training stats:", error);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTrainingStats();
      void loadPlants();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const analyzeImage = async (imageUrl: string) => {
    setIsAnalyzing(true);
    setPrediction(null);
    setCandidates([]);

    try {
      const formData = new FormData();
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      formData.append("image", blob, "plant.jpg");
      
      const apiResponse = await apiFetch("/api/identify-ensemble", {
        method: "POST",
        body: formData,
      });

      const data = await apiResponse.json();

      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
        const top = data.candidates[0];
        
        const matchedPlant = plants.find(plant => 
          plant.scientificName.toLowerCase() === top.scientificName.toLowerCase() ||
          plant.commonNames.some((name: string) => name.toLowerCase() === top.name.toLowerCase())
        );

        setPrediction({
          className: top.name,
          scientificName: top.scientificName,
          probability: top.confidence,
          confidence: top.confidence > 0.8 ? "high" : top.confidence > 0.5 ? "medium" : "low",
          plantData: matchedPlant || top.enrichedData,
          source: top.source,
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      await analyzeImage(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const addToTrainingData = async () => {
    if (!selectedImage || !newLabel) return;
    setTrainingFeedback(null);

    try {
      const formData = new FormData();
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      formData.append("image", blob, "training-image.jpg");
      formData.append("label", newLabel);
      formData.append("scientificName", newScientificName || prediction?.scientificName || "");

      const result = await apiFetch("/api/training", { method: "POST", body: formData });
      if (!result.ok) {
        const payload = await result.json().catch(() => null);
        throw new Error(payload?.error || "La contribution n’a pas pu être enregistrée.");
      }

      setTrainingDataCount(prev => prev + 1);
      setNewLabel("");
      setNewScientificName("");
      setTrainingFeedback({ kind: "success", text: "Contribution enregistrée et envoyée pour examen." });
      void fetchTrainingStats();
    } catch (error) {
      setTrainingFeedback({ kind: "error", text: error instanceof Error ? error.message : "Impossible d’enregistrer cette contribution." });
      console.error("Error adding training data:", error);
    }
  };

  return {
    selectedImage, setSelectedImage, prediction, setPrediction, candidates, setCandidates, isAnalyzing,
    trainingDataCount, showTrainingPanel, setShowTrainingPanel,
    newLabel, setNewLabel,
    newScientificName, setNewScientificName, trainingStats, trainingFeedback,
    fileInputRef, analyzeImage, handleImageUpload, addToTrainingData,
  };
}
