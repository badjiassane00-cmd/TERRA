"use client";

import { apiFetch } from "@/lib/api-client";
import { useState } from "react";
import { BrainCircuit, Loader2, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestion {
  id: string;
  scientificName: string;
  commonName: string | null;
  imageUrl: string | null;
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function PlantQuiz() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const startQuiz = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch("/api/quiz?count=8");
      const data = await res.json();
      if (data.error || !data.questions?.length) {
        setErrorMsg(data.error || "Impossible de générer un quiz pour le moment.");
        setStarted(false);
      } else {
        setQuestions(data.questions);
        setCurrent(0);
        setScore(0);
        setSelected(null);
        setFinished(false);
        setStarted(true);
      }
    } catch {
      setErrorMsg("Impossible de générer un quiz pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const answer = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === questions[current].correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const q = questions[current];

  return (
    <div className="botanical-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <BrainCircuit className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-xl font-bold text-foreground">Quiz de reconnaissance</h3>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Devinez la famille botanique des espèces identifiées sur la plateforme — un bon
        entraînement avant un TP ou un examen.
      </p>

      {!started && !isLoading && (
        <button
          onClick={startQuiz}
          className="text-sm px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
        >
          Démarrer un quiz
        </button>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-foreground/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Préparation du quiz...
        </div>
      )}

      {errorMsg && <p className="text-sm text-accent mt-3">{errorMsg}</p>}

      {started && !finished && q && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-foreground/50">
              Question {current + 1} / {questions.length}
            </p>
            <p className="text-xs text-foreground/50">Score : {score}</p>
          </div>

          <p className="font-serif text-lg text-foreground mb-1">{q.question}</p>
          {q.commonName && <p className="text-sm text-foreground/50 italic mb-4">({q.commonName})</p>}

          <div className="space-y-2 mb-4">
            {q.options.map((option) => {
              const isCorrect = option === q.correctAnswer;
              const isSelected = option === selected;
              let style = "border-border hover:border-primary";
              if (selected) {
                if (isCorrect) style = "border-primary bg-primary/10";
                else if (isSelected) style = "border-accent bg-accent/10";
                else style = "border-border opacity-50";
              }
              return (
                <button
                  key={option}
                  onClick={() => answer(option)}
                  disabled={!!selected}
                  className={`w-full text-left text-sm px-4 py-2.5 border rounded-lg transition-colors flex items-center justify-between ${style}`}
                >
                  {option}
                  {selected && isCorrect && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  {selected && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-accent" />}
                </button>
              );
            })}
          </div>

          {selected && (
            <button
              onClick={next}
              className="text-sm px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
            >
              {current + 1 >= questions.length ? "Voir le résultat" : "Question suivante"}
            </button>
          )}
        </div>
      )}

      {finished && (
        <div className="text-center py-6">
          <p className="font-serif text-2xl text-foreground mb-2">
            {score} / {questions.length}
          </p>
          <p className="text-sm text-foreground/60 mb-4">
            {score === questions.length
              ? "Score parfait !"
              : score >= questions.length / 2
              ? "Bon score, continuez à réviser."
              : "Encore un peu d'entraînement et ce sera acquis."}
          </p>
          <button
            onClick={startQuiz}
            className="flex items-center gap-2 text-sm px-4 py-2 border border-primary/30 text-primary rounded-full hover:bg-primary/5 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Nouveau quiz
          </button>
        </div>
      )}
    </div>
  );
}
