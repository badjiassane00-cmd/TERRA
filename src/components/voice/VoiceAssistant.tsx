"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";

// Type declarations for Web Speech API (not in default lib)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Type guard for webkitSpeechRecognition
interface VoiceAssistantProps {
  onResult?: (text: string) => void;
  onPlantIdentified?: (plantName: string) => void;
}

const suggestedQuestions = [
  "Quelle est cette plante ?",
  "Comment arroser un baobab ?",
  "Quelles plantes médicinales dans ma région ?",
  "Quand fleurit l'acacia ?",
  "Comment soigner l'oïdium ?",
];

// Pre-generate random heights for the audio visualization bars
const barHeights = [12, 18, 22, 15, 20, 25, 17, 19, 23, 14];

export default function VoiceAssistant({ onResult, onPlantIdentified }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Use useMemo to generate stable random heights for the visualization bars
  const visualizationBars = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => ({
      height: `${barHeights[i % barHeights.length]}px`,
      animationDelay: `${i * 0.1}s`,
    }))
  , []);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "fr-FR";

      recognitionRef.current.onresult = async (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsProcessing(true);
        setError(null);

        try {
          const res = await fetch("/api/voice-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: text }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setResponse(data.response);
          onResult?.(text);
          onPlantIdentified?.(data.plantName);

          if (data.speak) {
            speak(data.response);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erreur vocale");
        } finally {
          setIsProcessing(false);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`Erreur reconnaissance: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onResult, onPlantIdentified]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Reconnaissance vocale non supportée par ce navigateur");
      return;
    }

    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    } else {
      setTranscript("");
      setResponse("");
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="herbarium-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full border border-border bg-paper flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-serif font-semibold text-foreground">Assistant vocal botanique</h3>
          <p className="text-xs text-foreground/60">
            Posez une question sur les plantes
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`herbarium-button flex-1 ${
            isListening
              ? "bg-terracotta text-white border-terracotta"
              : "herbarium-button-primary"
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              Arrêter
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyse...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Parler
            </>
          )}
        </button>
        {response && (
          <button
            onClick={stopSpeaking}
            className="herbarium-button"
          >
            <Volume2 className="w-4 h-4" />
            Stop
          </button>
        )}
      </div>

      {isListening && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex gap-1">
            {visualizationBars.map((bar, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: bar.height,
                  animationDelay: bar.animationDelay,
                }}
              />
            ))}
          </div>
          <p className="text-sm text-primary font-medium">Écoute en cours...</p>
        </div>
      )}

      {transcript && (
        <div className="mb-3 p-3 bg-paper border border-border rounded-lg">
          <p className="text-xs text-foreground/60 mb-1">Vous avez dit:</p>
          <p className="text-sm text-foreground italic">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

      {response && (
        <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs text-foreground/60 mb-1">Réponse:</p>
          <p className="text-sm text-foreground">{response}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-terracotta/10 border border-terracotta/30 rounded-lg">
          <p className="text-sm text-terracotta">{error}</p>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <p className="text-xs text-foreground/60 mb-2">Questions suggérées:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => {
                setTranscript(q);
                setIsProcessing(true);
                fetch("/api/voice-assistant", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ query: q }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.response) {
                      setResponse(data.response);
                      speak(data.response);
                    }
                  })
                  .catch(() => setError("Erreur lors de la requête"))
                  .finally(() => setIsProcessing(false));
              }}
              className="herbarium-label text-xs cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
