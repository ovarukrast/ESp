import React, { useState, useEffect, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { Difficulty, ExerciseType } from '../types';
import { PenIcon } from './icons/PenIcon';
import { PdfIcon } from './icons/PdfIcon';
import { InteractiveIcon } from './icons/InteractiveIcon';
import { UnitHeader } from './UnitHeader';
import { getUnitColorInfo, getSubtitleInfo } from '../utils';

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
    readonly length: number;
  }
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    // FIX: Changed type from `any` to `unknown` for better type safety.
    error: unknown;
  }
  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
}

interface ExerciseSheetProps {
  content: string;
  topic: string;
  difficulty: Difficulty | null;
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
  topic,
  difficulty,
  isLoading,
  error,
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [usedWords, setUsedWords] = useState<Record<number, {word: string, index: number}[]>>({});
  const [listeningQuestionIndex, setListeningQuestionIndex] = useState<number | null>(null);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  
  const unitColor = useMemo(() => getUnitColorInfo(topic), [topic]);
  const subtitle = useMemo(() => {
    if (!topic || !difficulty) return '';
    return getSubtitleInfo(topic, difficulty);
  }, [topic, difficulty]);

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
      const optionRegex = /^\([A-Z]\)/;

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
        } else if (currentQuestion && optionRegex.test(line)) {
            // If we find an option, this must be a multiple choice question, even if the question text has a blank space.
            currentQuestion.type = ExerciseType.MULTIPLE_CHOICE;
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
      // FIX: The error object `e` from a catch block is of type `unknown` and must be converted to a string to prevent type errors.
      console.error("Error parsing content:", String(e));
      return null;
    }
  }, [content]);

  useEffect(() => {
    handleReset();
    setIsInteractiveMode(false);
  }, [content]);

  const handleAnswerChange = (qNumber: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [qNumber]: answer }));
  };
  
  const handleWordClick = (qNumber: number, word: string, index: number) => {
    const currentAnswer = userAnswers[qNumber] || '';
    const newAnswer = currentAnswer ? `${currentAnswer} ${word}` : word;
    handleAnswerChange(qNumber, newAnswer);
    setUsedWords(prev => ({...prev, [qNumber]: [...(prev[qNumber] || []), {word, index}]}));
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
  
  const handleStartInteractive = () => {
    setIsInteractiveMode(true);
    handleReset();
  };

  const handleDownloadPdf = () => {
    if (!parsedContent) return;

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });
    
    doc.setFont('helvetica');

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - 2 * margin;
    let currentY = 0;

    // Header
    const headerHeight = 35;
    doc.setFillColor(unitColor.hex);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Subtitle
    if (subtitle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(unitColor.textHex);
      doc.text(subtitle.toUpperCase(), margin + 10, margin - 2);
    }
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(parsedContent.title, usableWidth - 20);
    doc.text(titleLines, margin + 10, margin + (subtitle ? 4 : 2));

    // Instruction
    doc.setTextColor(unitColor.textHex);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const instructionLinesHeader = doc.splitTextToSize(parsedContent.instruction, usableWidth - 20);
    doc.text(instructionLinesHeader, margin + 10, margin + (subtitle ? 4 : 2) + titleLines.length * 7.5);
    
    currentY = headerHeight + 15;

    const checkPageBreak = (spaceNeeded: number) => {
      if (currentY + spaceNeeded > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
    };

    // Questions
    doc.setTextColor(55, 65, 81); // gray-700
    parsedContent.questions.forEach(q => {
      let questionText;
      if (q.type === ExerciseType.FILL_IN_THE_BLANK) {
        questionText = `${q.number}. ${q.text.replace(/\[___\]/g, '____________________')}`;
      } else {
        questionText = `${q.number}. ${q.text}`;
      }
      
      doc.setFontSize(12);
      const questionLines = doc.splitTextToSize(questionText, usableWidth);
      
      let spaceForQuestion = (questionLines.length * 7) + 8; // text height + space after
      if (q.type === ExerciseType.MULTIPLE_CHOICE && q.options) {
        spaceForQuestion += (q.options.length * 6);
      }
      
      checkPageBreak(spaceForQuestion);

      doc.text(questionLines, margin, currentY);
      currentY += questionLines.length * 7;

      if (q.type === ExerciseType.MULTIPLE_CHOICE && q.options) {
        doc.setFontSize(11);
        q.options.forEach(option => {
            currentY += 6;
            const optionLines = doc.splitTextToSize(option, usableWidth - 5);
            doc.text(optionLines, margin + 5, currentY);
        });
        currentY += 5;
      }
      
      currentY += 8; // Space between questions
    });

    // Answer Key on a new page
    doc.addPage();
    currentY = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Clave de Respuestas', margin, currentY);
    currentY += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const answerKeys = Object.entries(parsedContent.answers)
        .sort(([numA], [numB]) => parseInt(numA) - parseInt(numB));

    answerKeys.forEach(([num, answer]) => {
      const answerText = `${num}. ${getPrimaryAnswer(answer)}`;
      const answerLines = doc.splitTextToSize(answerText, usableWidth);
      checkPageBreak(answerLines.length * 7 + 3);
      doc.text(answerLines, margin, currentY);
      currentY += answerLines.length * 7 + 3;
    });

    doc.save(`${parsedContent.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
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
      // FIX: The `event.error` property is of type `unknown` and must be converted to a string before being passed to `console.error` to avoid type errors.
      console.error("Speech recognition error:", String(event.error));
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
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <SpinnerIcon />
          <p className="mt-4 text-gray-600 font-medium">Generando tu ficha de ejercicios...</p>
          <p className="mt-1 text-sm text-gray-500">Esto puede tardar unos segundos...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white p-8 rounded-2xl border border-rose-200 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-rose-700">Oops, algo salió mal</p>
          <p className="mt-4 text-gray-700 bg-rose-50 p-4 rounded-md text-left">{error}</p>
        </div>
      </section>
    );
  }

  if (!content || !parsedContent) {
    return (
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[600px] flex items-center justify-center">
        <div className="text-center">
            <div className="flex justify-center mb-6">
                <PenIcon />
            </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-800">Tu ficha de ejercicios aparecerá aquí</h2>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">Selecciona un tema, tipo de ejercicio y dificultad para empezar a aprender español de forma interactiva.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <UnitHeader 
            title={parsedContent.title} 
            subtitle={subtitle}
            instruction={parsedContent.instruction}
            color={unitColor}
        />
        
        <div className="p-6 sm:p-8">
            <style>{`.break-inside-avoid { break-inside: avoid; }`}</style>
            
            <ul className="divide-y divide-gray-100">
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
                ? `py-6 px-4 -mx-4 transition-colors break-inside-avoid ${isCorrect ? 'bg-emerald-50' : 'bg-rose-50'}`
                : 'py-6 break-inside-avoid';
                
                return (
                <li key={q.number} className={questionClass}>
                    <div className="font-medium text-gray-800 mb-4 text-base">
                    {q.type === ExerciseType.FILL_IN_THE_BLANK ? (
                        <>
                        <span>{`${q.number}. `}</span>
                        {q.text.split('[___]').map((part, i, arr) => (
                            <React.Fragment key={i}>
                            <span>{part}</span>
                            {i < arr.length - 1 && (
                                isInteractiveMode ? (
                                <div className="inline-flex items-center mx-2">
                                    <input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => handleAnswerChange(q.number, e.target.value)}
                                    disabled={showAnswers}
                                    className="border border-gray-300 rounded-md shadow-sm w-48 px-3 py-1.5 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button onClick={() => handleDictation(q.number)} disabled={showAnswers || listeningQuestionIndex !== null} className="ml-2 text-gray-400 hover:text-indigo-600 disabled:text-gray-300 relative p-1 rounded-full hover:bg-gray-100 transition-colors">
                                    <MicrophoneIcon />
                                    {listeningQuestionIndex === q.number && (
                                        <span className="animate-ping absolute top-0 left-0 inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                    )}
                                    </button>
                                </div>
                                ) : (
                                <span className="inline-block border-b-2 border-dotted border-gray-400 w-48 h-6 align-bottom mx-2"></span>
                                )
                            )}
                            </React.Fragment>
                        ))}
                        </>
                    ) : (
                        `${q.number}. ${q.text}`
                    )}
                    </div>

                    {q.type === ExerciseType.MULTIPLE_CHOICE && (
                    isInteractiveMode ? (
                        <div className="space-y-3">
                        {q.options?.map((option, index) => (
                            <label key={option} className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${userAnswer === option.substring(4).trim() ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                            <input 
                                type="radio" 
                                id={`q-${q.number}-${index}`}
                                name={`q-${q.number}`} 
                                value={option.substring(4).trim()}
                                checked={userAnswer === option.substring(4).trim()}
                                onChange={(e) => handleAnswerChange(q.number, e.target.value)}
                                disabled={showAnswers}
                                className="peer/radio sr-only"
                            />
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 peer-checked/radio:border-indigo-600 bg-white flex items-center justify-center flex-shrink-0">
                                <div className="h-2.5 w-2.5 rounded-full bg-indigo-600 scale-0 peer-checked/radio:scale-100 transition-transform"></div>
                            </div>
                            <span className="ml-3 text-sm text-gray-700">{option}</span>
                            </label>
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 text-gray-700">
                        {q.options?.map((option, index) => (
                            <span key={index} className="text-sm">{option}</span>
                        ))}
                        </div>
                    )
                    )}
                    
                    {q.type === ExerciseType.SENTENCE_ORDERING && (
                    isInteractiveMode ? (
                        <div>
                            <div className="p-3 mb-4 min-h-[48px] bg-gray-50 rounded-lg border border-gray-200 text-gray-800 font-medium flex items-center">
                                {userAnswer || <span className="text-gray-400">Construye la frase aquí...</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                                {q.words?.map((word, i) => {
                                    const isUsed = usedWords[q.number]?.some(used => used.index === i);
                                    return (
                                        <button
                                            key={`${word}-${i}`}
                                            onClick={() => handleWordClick(q.number, word, i)}
                                            disabled={showAnswers || isUsed}
                                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {word}
                                        </button>
                                    )
                                })}
                                <button onClick={() => handleClearSentence(q.number)} disabled={showAnswers} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline disabled:opacity-50 ml-2">Limpiar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 italic">
                            {q.text}
                        </div>
                    )
                    )}

                    {showAnswers && !isCorrect && (
                    <div className="mt-4 text-sm font-medium text-emerald-800 p-3 bg-emerald-100/70 rounded-lg">
                        Respuesta correcta: {getPrimaryAnswer(correctAnswerKey)}
                    </div>
                    )}
                </li>
                );
            })}
            </ul>
            {showAnswers && (
              <div className="mt-8 pt-6 border-t border-gray-200 break-inside-avoid">
                  <h2 className="text-xl font-bold font-display text-gray-800 mb-4">Clave de Respuestas</h2>
                  <ul className="space-y-2 text-sm">
                      {Object.entries(parsedContent.answers)
                          .sort(([numA], [numB]) => parseInt(numA) - parseInt(numB))
                          .map(([num, answer]) => (
                          <li key={num} className="flex">
                              <span className="font-semibold w-8">{num}.</span>
                              <span className="text-gray-700">{getPrimaryAnswer(answer)}</span>
                          </li>
                      ))}
                  </ul>
              </div>
            )}
        </div>
        
        <div className="mt-4 p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4 flex-wrap print:hidden">
            {isInteractiveMode ? (
                <>
                    <div>
                        {score && (
                            <p className="text-lg font-bold text-gray-800">
                            Puntuación: <span className="text-indigo-600">{score.correct} / {score.total}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex gap-4">
                    <button
                        onClick={handleReset}
                        className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 font-semibold py-2 px-5 rounded-lg transition-colors text-sm shadow-sm"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleCheckAnswers}
                        disabled={!isAllAnswered || showAnswers}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold py-2 px-5 rounded-lg transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed text-sm shadow-sm"
                    >
                        Revisar Respuestas
                    </button>
                    </div>
                </>
            ) : (
                <div className="flex w-full justify-end">
                    <div className="flex gap-4">
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-2 bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 font-semibold py-2 px-5 rounded-lg transition-colors text-sm shadow-sm"
                        >
                            <PdfIcon />
                            Descargar PDF
                        </button>
                        <button
                            onClick={handleStartInteractive}
                            className={`flex items-center gap-2 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm shadow-sm ${unitColor.bg.replace('-600', '-500')} hover:${unitColor.bg}`}
                        >
                            <InteractiveIcon />
                            Resolver Interactivo
                        </button>
                    </div>
                </div>
            )}
        </div>
    </section>
  );
};