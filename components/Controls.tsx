import React, { useState, useEffect } from 'react';
import { Difficulty, ExerciseType } from '../types';
import {
  EXERCISE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  TOPICS_BY_DIFFICULTY,
} from '../constants';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';

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
    <aside className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Crea tu Ficha</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nivel de Dificultad
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="bg-white w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors shadow-sm appearance-none"
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1.5">
            Tema
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-white w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors shadow-sm appearance-none"
          >
            {Object.entries(availableTopicsByCategory).map(([category, topics]) => (
              <optgroup key={category} label={category}>
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
          <label htmlFor="exerciseType" className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo de Ejercicio
          </label>
          <select
            id="exerciseType"
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
            className="bg-white w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors shadow-sm appearance-none"
          >
            {EXERCISE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-2">
            Número de Preguntas: <span className="font-bold text-indigo-600">{numQuestions}</span>
          </label>
          <input
            type="range"
            id="numQuestions"
            min="5"
            max="20"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? <SpinnerIcon /> : <SparklesIcon />}
          {isLoading ? 'Generando...' : 'Generar Ficha'}
        </button>
      </form>
    </aside>
  );
};
