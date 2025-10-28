import React, { useState, useEffect, useMemo } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { ExerciseType } from '../types';

// Web Speech API type definitions for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    // Fix: Add missing 'maxAlternatives' property to SpeechRecognition interface.
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    // Fix: Add 'readonly' modifier to match built-in DOM type.
    readonly length: number;
  }
  interface SpeechRecognitionResult {
    // Fix: Add 'readonly' modifier to match built-in DOM type.
    readonly isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    // Fix: Add 'readonly' modifier to match built-in DOM type.
    readonly transcript: string;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
}

interface ExerciseSheetProps {
  content: string;
  isLoading: boolean;
  error: string | null;
}

interface ParsedQuestion {
  number: number;
  text: string;
  type: ExerciseType;
  options?: string[];
  words?: string[];
}

interface ParsedContent {
  title: string;
  instruction: string;
  questions: ParsedQuestion[];
  answers: Record<number, string>;
}

const checkSentenceOrderingAnswer = (correctAnswerKey: string, userAnswer: string): boolean => {
    if (!correctAnswerKey || !userAnswer) return false;
    const possibleAnswers = correctAnswerKey.trim().toLowerCase().split('|').map(a => a.trim());
    return possibleAnswers.includes(userAnswer.trim().toLowerCase());
};

const getPrimaryAnswer = (correctAnswerKey: string): string => {
    if (!correctAnswerKey) return '';
    return correctAnswerKey.split('|')[0].trim();
}


export const ExerciseSheet: React.FC<ExerciseSheetProps> = ({
  content,
  isLoading,
  error,
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [usedWords, setUsedWords] = useState<Record<number, string[]>>({});
  const [listeningQuestionIndex, setListeningQuestionIndex] = useState<number | null>(null);
  
  const parsedContent = useMemo<ParsedContent | null>(() => {
    if (!content) return null;

    try {
      const parts = content.split('## Clave de Respuestas');
      if (parts.length < 2) throw new Error("Formato de contenido inválido: No se encontró la clave de respuestas.");
      const mainContent = parts[0];
      const answerKeyContent = parts[1];
      
      const lines = mainContent.trim().split('\n').filter(line => line.trim() !== '');
      const title = lines[0]?.substring(2).trim() || 'Ficha de Ejercicios';
      const instruction = lines[1]?.trim() || '';

      const questions: ParsedQuestion[] = [];
      const questionRegex = /^(\d+)\.\s(.*)/;

      let currentQuestion: ParsedQuestion | null = null;
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        const questionMatch = line.match(questionRegex);
        
        if (questionMatch) {
          if (currentQuestion) questions.push(currentQuestion);
          const number = parseInt(questionMatch[1], 10);
          const text = questionMatch[2].trim();
          let type: ExerciseType;
          let words: string[] | undefined = undefined;

          if (text.includes('[___]')) {
            type = ExerciseType.FILL_IN_THE_BLANK;
          } else if (text.includes(' / ')) {
            type = ExerciseType.SENTENCE_ORDERING;
            words = text.split(' / ').map(w => w.trim());
          } else {
            type = ExerciseType.MULTIPLE_CHOICE;
          }
          
          currentQuestion = { number, text, type, options: [], words };
        } else if (currentQuestion && currentQuestion.type === ExerciseType.MULTIPLE_CHOICE && /^\([A-Z]\)/.test(line)) {
            currentQuestion.options?.push(line.trim());
        }
      }
      if (currentQuestion) questions.push(currentQuestion);

      const answers: Record<number, string> = {};
      answerKeyContent.trim().split('\n').forEach(line => {
        const answerMatch = line.match(/^(\d+)\.\s(.*)/);
        if (answerMatch) {
          answers[parseInt(answerMatch[1], 10)] = answerMatch[2].trim();
        }
      });
      
      return { title, instruction, questions, answers };
    } catch (e) {
      console.error("Error parsing content:", e);
      return null;
    }
  }, [content]);

  useEffect(() => {
    handleReset();
  }, [content]);

  const handleAnswerChange = (qNumber: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [qNumber]: answer }));
  };
  
  const handleWordClick = (qNumber: number, word: string) => {
    const currentAnswer = userAnswers[qNumber] || '';
    const newAnswer = currentAnswer ? `${currentAnswer} ${word}` : word;
    handleAnswerChange(qNumber, newAnswer);
    setUsedWords(prev => ({...prev, [qNumber]: [...(prev[qNumber] || []), word]}));
  };

  const handleClearSentence = (qNumber: number) => {
    handleAnswerChange(qNumber, '');
    setUsedWords(prev => ({...prev, [qNumber]: []}));
  };

  const handleCheckAnswers = () => {
    if (!parsedContent) return;
    let correctCount = 0;
    parsedContent.questions.forEach(q => {
        const userAnswer = userAnswers[q.number] || '';
        const correctAnswerKey = parsedContent.answers[q.number] || '';
        let isMatch = false;

        if (q.type === ExerciseType.SENTENCE_ORDERING) {
            isMatch = checkSentenceOrderingAnswer(correctAnswerKey, userAnswer);
        } else {
            isMatch = userAnswer.trim().toLowerCase() === correctAnswerKey.trim().toLowerCase();
        }
        
        if (isMatch) {
            correctCount++;
        }
    });
    setScore({ correct: correctCount, total: parsedContent.questions.length });
    setShowAnswers(true);
  };
  
  const handleReset = () => {
    setUserAnswers({});
    setShowAnswers(false);
    setScore(null);
    setUsedWords({});
    setListeningQuestionIndex(null);
  };

  const handleDictation = (qNumber: number) => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Lo siento, tu navegador no soporta el reconocimiento de voz.");
      return;
    }

    if (listeningQuestionIndex === qNumber) {
        return; 
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListeningQuestionIndex(qNumber);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleAnswerChange(qNumber, transcript.replace(/\.$/, ''));
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setListeningQuestionIndex(null);
    };

    recognition.start();
  };

  const isAllAnswered = useMemo(() => {
    if (!parsedContent) return false;
    return parsedContent.questions.length > 0 && parsedContent.questions.every(q => userAnswers[q.number]?.trim());
  }, [userAnswers, parsedContent]);


  if (isLoading) {
    return (
      <section className="bg-white p-8 rounded-lg shadow-lg border border-slate-200 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <SpinnerIcon />
          <p className="mt-4 text-slate-600 font-medium text-lg">Generando tu ficha de ejercicios...</p>
          <p className="mt-2 text-sm text-slate-500">Esto puede tardar unos segundos...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white p-8 rounded-lg shadow-lg border border-red-200 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold text-red-700">Oops, algo salió mal</p>
          <p className="mt-4 text-slate-700 bg-red-5 p-4 rounded-md text-left">{error}</p>
        </div>
      </section>
    );
  }

  if (!content || !parsedContent) {
    return (
      <section className="bg-white p-8 rounded-lg shadow-lg border-2 border-dashed border-slate-300 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
            <span className="text-6xl" role="img" aria-label="writing-hand">✍️</span>
          <h2 className="mt-6 text-2xl font-bold text-slate-800">Tu ficha de ejercicios aparecerá aquí</h2>
          <p className="mt-2 text-slate-500 max-w-md mx-auto">Selecciona un tema, tipo de ejercicio y dificultad para empezar a aprender español de forma interactiva.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white p-8 rounded-lg shadow-lg border border-slate-200">
      <h1 className="text-3xl font-bold mb-2">{parsedContent.title}</h1>
      <p className="text-slate-600 mb-8">{parsedContent.instruction}</p>
      
      <div className="space-y-8">
        {parsedContent.questions.map(q => {
          const userAnswer = userAnswers[q.number] || '';
          const correctAnswerKey = parsedContent.answers[q.number] || '';
          
          let isCorrect = false;
          if (showAnswers) {
              if (q.type === ExerciseType.SENTENCE_ORDERING) {
                  isCorrect = checkSentenceOrderingAnswer(correctAnswerKey, userAnswer);
              } else {
                  isCorrect = userAnswer.trim().toLowerCase() === correctAnswerKey.trim().toLowerCase();
              }
          }

          const questionClass = showAnswers 
            ? `p-4 rounded-lg border-2 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`
            : 'p-4 rounded-lg border border-slate-200';
          
          return (
            <div key={q.number} className={questionClass}>
              <div className="font-semibold text-slate-800 mb-4 text-lg">
                {q.type === ExerciseType.FILL_IN_THE_BLANK 
                  ? q.text.split('[___]').map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                            <div className="inline-flex items-center mx-2">
                                <input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => handleAnswerChange(q.number, e.target.value)}
                                    disabled={showAnswers}
                                    className="border-b-2 border-slate-400 focus:border-blue-500 outline-none w-32 px-1 py-0.5 bg-transparent"
                                />
                                <button onClick={() => handleDictation(q.number)} disabled={showAnswers || listeningQuestionIndex !== null} className="ml-2 text-slate-500 hover:text-blue-600 disabled:text-slate-300 relative">
                                    <MicrophoneIcon />
                                    {listeningQuestionIndex === q.number && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    )}
                                </button>
                            </div>
                        )}
                      </React.Fragment>
                  ))
                  : `${q.number}. ${q.text}`
                }
              </div>

              {q.type === ExerciseType.MULTIPLE_CHOICE && (
                <div className="space-y-2">
                  {q.options?.map(option => (
                    <label key={option} className="flex items-center p-3 rounded-md hover:bg-slate-100 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`q-${q.number}`} 
                        value={option.substring(4).trim()}
                        checked={userAnswer === option.substring(4).trim()}
                        onChange={(e) => handleAnswerChange(q.number, e.target.value)}
                        disabled={showAnswers}
                        className="mr-3"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
              
              {q.type === ExerciseType.SENTENCE_ORDERING && (
                 <div>
                    <div className="p-4 mb-4 min-h-[50px] bg-slate-100 rounded-md border border-slate-300 text-slate-800 font-medium">
                        {userAnswer || <span className="text-slate-400">Construye la frase aquí...</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {q.words?.map((word, i) => {
                            const isUsed = usedWords[q.number]?.includes(word);
                            return (
                                <button
                                    key={`${word}-${i}`}
                                    onClick={() => handleWordClick(q.number, word)}
                                    disabled={showAnswers || isUsed}
                                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                                >
                                    {word}
                                </button>
                            )
                        })}
                        <button onClick={() => handleClearSentence(q.number)} disabled={showAnswers} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 disabled:opacity-50">Limpiar</button>
                    </div>
                 </div>
              )}

              {showAnswers && !isCorrect && (
                <div className="mt-3 text-sm font-semibold text-green-800 p-2 bg-green-100 rounded-md">
                  Respuesta correcta: {getPrimaryAnswer(correctAnswerKey)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 pt-6 border-t flex items-center justify-between gap-4">
        <div>
          {score && (
             <p className="text-xl font-bold text-slate-800">
                Puntuación: {score.correct} / {score.total}
             </p>
          )}
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleReset}
            className="bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Reiniciar
          </button>
          <button
            onClick={handleCheckAnswers}
            disabled={!isAllAnswered || showAnswers}
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Revisar Respuestas
          </button>
        </div>
      </div>

    </section>
  );
};