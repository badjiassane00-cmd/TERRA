"use client";
/* eslint-disable @next/next/no-img-element -- selected local image previews use data URLs */

import { motion, AnimatePresence } from "framer-motion";
import { usePlantRecognition } from "./usePlantRecognition";
import { Camera, X, Loader2, Brain, TrendingUp, Award, Check, XCircle, Leaf, Users, Globe, Zap } from "lucide-react";

export default function AIPlantRecognition() {
  const {
    selectedImage, setSelectedImage, prediction, setPrediction, candidates, setCandidates, isAnalyzing,
    trainingDataCount, modelVersion, isModelLoading, showTrainingPanel, setShowTrainingPanel,
    isTraining, trainingProgress, modelAccuracy, newLabel, setNewLabel,
    newScientificName, setNewScientificName, trainingStats, analysisMode,
    setAnalysisMode, fileInputRef, handleImageUpload, addToTrainingData, trainModel,
  } = usePlantRecognition();

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "text-primary bg-primary/10";
      case "medium": return "text-accent bg-accent/10";
      case "low": return "text-terracotta bg-terracotta/10";
      default: return "text-foreground/60 bg-paper";
    }
  };

  if (isModelLoading) {
    return (
      <div className="herbarium-card rounded-xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-foreground/70">Chargement du modèle ensemble...</p>
            <p className="text-xs text-foreground/50 mt-2">Plant.id + Pl@ntNet + Classifieur local</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="herbarium-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-border bg-paper flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-foreground">IA Botanique Globale</h3>
            <p className="text-xs text-foreground/60">Modèle: {modelVersion} • {trainingStats.species} espèces</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={analysisMode}
            onChange={(e) => setAnalysisMode(e.target.value as "fast" | "deep")}
            className="herbarium-input text-xs py-1.5 px-3"
          >
            <option value="fast">Analyse rapide</option>
            <option value="deep">Analyse approfondie</option>
          </select>
          <button
            onClick={() => setShowTrainingPanel(!showTrainingPanel)}
            className="herbarium-button"
          >
            <TrendingUp className="w-4 h-4" />
            Contribuer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
          />
          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Camera className="w-12 h-12 text-primary/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Cliquez ou déposez une image
              </p>
              <p className="text-xs text-foreground/60">
                Reconnaissance globale via 3 sources
              </p>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-foreground/50">
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Plant.id</span>
                <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> Pl@ntNet</span>
                <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Local</span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={selectedImage}
                alt="Plante à analyser"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setPrediction(null);
                  setCandidates([]);
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="scan-line" />
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          {prediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="herbarium-card rounded-xl p-6 border border-primary/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-serif text-xl font-bold text-foreground mb-1">
                    {prediction.className}
                  </h4>
                  <p className="text-sm text-foreground/60 italic">
                    {prediction.scientificName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="herbarium-label text-xs">
                      <Zap className="w-3 h-3" />
                      {prediction.source}
                    </span>
                  </div>
                </div>
                <span className={`herbarium-label ${getConfidenceColor(prediction.confidence)}`}>
                  {Math.round(prediction.probability * 100)}%
                </span>
              </div>

              {prediction.plantData && (
                <div className="mb-4 space-y-3">
                  {prediction.plantData.family && (
                    <div className="flex items-center gap-2 text-sm">
                      <Leaf className="w-4 h-4 text-primary" />
                      <span className="text-foreground/70">Famille: {prediction.plantData.family}</span>
                    </div>
                  )}
                  {prediction.plantData.description && (
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      {prediction.plantData.description}
                    </p>
                  )}
                  {prediction.plantData.care && (
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {prediction.plantData.care.watering && (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground/60">Arrosage:</span>
                          <span className="text-foreground">{prediction.plantData.care.watering}</span>
                        </div>
                      )}
                      {prediction.plantData.care.sunlight && (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground/60">Ensoleillement:</span>
                          <span className="text-foreground">{prediction.plantData.care.sunlight}</span>
                        </div>
                      )}
                      {prediction.plantData.care.soil && (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground/60">Sol:</span>
                          <span className="text-foreground">{prediction.plantData.care.soil}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground/70">Confiance</span>
                  <span className="text-xs text-foreground/60">
                    {prediction.confidence === "high" ? "Élevée" : 
                     prediction.confidence === "medium" ? "Moyenne" : "Faible"}
                  </span>
                </div>
                <div className="confidence-gauge">
                  <div
                    className={`confidence-gauge-fill ${
                      prediction.confidence === "high" ? "bg-primary" :
                      prediction.confidence === "medium" ? "bg-accent" : "bg-terracotta"
                    }`}
                    style={{ width: `${prediction.probability * 100}%` }}
                  />
                </div>
              </div>

              {candidates.length > 1 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-foreground/70 mb-2">Autres candidates:</p>
                  <div className="space-y-1">
                    {candidates.slice(1, 4).map((candidate, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-foreground/70">{candidate.scientificName}</span>
                        <span className="text-foreground/50">{Math.round(candidate.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground/70 mb-2">
                  Cette identification est-elle correcte ?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTrainingPanel(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Oui
                  </button>
                  <button
                    onClick={() => setShowTrainingPanel(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-terracotta/10 text-terracotta rounded-lg hover:bg-terracotta/20 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Corriger
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {!prediction && !isAnalyzing && (
            <div className="herbarium-card rounded-xl p-12 text-center">
              <Brain className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60 mb-2">Aucune analyse en cours</p>
              <p className="text-sm text-foreground/50">
                Téléchargez une image pour identifier une plante
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTrainingPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 border-t border-border pt-6"
          >
            <h4 className="font-serif font-semibold text-foreground mb-4">
              Contribution collaborative
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1">
                  Nom de la plante
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="herbarium-input"
                  placeholder="Ex: Baobab"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1">
                  Nom scientifique
                </label>
                <input
                  type="text"
                  value={newScientificName}
                  onChange={(e) => setNewScientificName(e.target.value)}
                  className="herbarium-input"
                  placeholder="Ex: Adansonia digitata"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={addToTrainingData}
                disabled={!newLabel}
                className="herbarium-button herbarium-button-primary"
              >
                <Users className="w-4 h-4" />
                Contribuer au dataset
              </button>
              <span className="text-xs text-foreground/60">
                {trainingDataCount} contributions
              </span>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="text-sm font-medium text-foreground mb-1">
                    Modèle ensemble global
                  </h5>
                  <p className="text-xs text-foreground/60">
                    Précision: {(modelAccuracy * 100).toFixed(1)}% • Couverture mondiale
                  </p>
                </div>
                <button
                  onClick={trainModel}
                  disabled={isTraining}
                  className="herbarium-button herbarium-button-primary"
                >
                  {isTraining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Amélioration...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Améliorer le modèle
                    </>
                  )}
                </button>
              </div>

              {isTraining && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground/70">Progression</span>
                    <span className="text-xs text-foreground/60">{Math.round(trainingProgress)}%</span>
                  </div>
                  <div className="confidence-gauge">
                    <div
                      className="confidence-gauge-fill bg-primary"
                      style={{ width: `${trainingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div className="border border-border rounded-lg p-3 bg-paper text-center">
                  <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">
                    {(modelAccuracy * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-foreground/60">Précision</p>
                </div>
                <div className="border border-border rounded-lg p-3 bg-paper text-center">
                  <Leaf className="w-4 h-4 text-accent mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{trainingStats.species}+</p>
                  <p className="text-xs text-foreground/60">Espèces</p>
                </div>
                <div className="border border-border rounded-lg p-3 bg-paper text-center">
                  <Globe className="w-4 h-4 text-terracotta mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{trainingStats.sources}</p>
                  <p className="text-xs text-foreground/60">Sources</p>
                </div>
                <div className="border border-border rounded-lg p-3 bg-paper text-center">
                  <Award className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{trainingDataCount}</p>
                  <p className="text-xs text-foreground/60">Contributions</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
