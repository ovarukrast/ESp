
import React, { useState, useEffect } from 'react';
import { Difficulty, ExerciseType } from '../types';
import {
  EXERCISE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  TOPICS_BY_DIFFICULTY,
} from '../constants';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ControlsProps {
  onGenerate: (
    topic: string,
    exerciseType: ExerciseType,
    difficulty: Difficulty,
    numQuestions: number
  ) => void;
  isLoading: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ onGenerate, isLoading }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.A2);
  const [availableTopicsByCategory, setAvailableTopicsByCategory] = useState<{[key: string]: string[]}>(TOPICS_BY_DIFFICULTY[difficulty]);
  const [topic, setTopic] = useState<string>(TOPICS_BY_DIFFICULTY[difficulty]['Vocabulario'][0]);
  const [exerciseType, setExerciseType] = useState<ExerciseType>(ExerciseType.FILL_IN_THE_BLANK);
  const [numQuestions, setNumQuestions] = useState<number>(5);

  useEffect(() => {
    const newTopicsByCategory = TOPICS_BY_DIFFICULTY[difficulty];
    setAvailableTopicsByCategory(newTopicsByCategory);
    const firstCategory = Object.keys(newTopicsByCategory)[0];
    // Fix: Add a check to ensure the topic exists before setting it.
    if (firstCategory && newTopicsByCategory[firstCategory]?.length > 0) {
      setTopic(newTopicsByCategory[firstCategory][0]);
    } else {
      setTopic('');
    }
  }, [difficulty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate(topic, exerciseType, difficulty, numQuestions);
  };

  return (
    <aside className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 print:hidden">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Crea tu Ficha</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 mb-1">
            Nivel de Dificultad
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">
            Tema
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(availableTopicsByCategory).map(([category, topics]) => (
              <optgroup key={category} label={category}>
                {/* Fix: Property 'map' does not exist on type 'unknown'. Add Array.isArray check to ensure topics is an array. */}
                {Array.isArray(topics) && topics.map((topicOption) => (
                  <option key={topicOption} value={topicOption}>
                    {topicOption}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="exerciseType" className="block text-sm font-medium text-slate-700 mb-1">
            Tipo de Ejercicio
          </label>
          <select
            id="exerciseType"
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {EXERCISE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="numQuestions" className="block text-sm font-medium text-slate-700 mb-1">
            Número de Preguntas: <span className="font-bold text-slate-800">{numQuestions}</span>
          </label>
          <input
            type="range"
            id="numQuestions"
            min="5"
            max="20"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
        >
          {isLoading ? <SpinnerIcon /> : '✨'}
          {isLoading ? 'Generando...' : 'Generar Ficha'}
        </button>
      </form>
    </aside>
  );
};