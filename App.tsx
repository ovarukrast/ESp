import React, { useState } from 'react';
import { Controls } from './components/Controls';
import { Header } from './components/Header';
import { ExerciseSheet } from './components/ExerciseSheet';
import { Difficulty, ExerciseType } from './types';
import { generateExerciseSheet } from './services/geminiService';

function App() {
  const [exerciseSheetContent, setExerciseSheetContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (
    topic: string,
    exerciseType: ExerciseType,
    difficulty: Difficulty,
    numQuestions: number
  ) => {
    setIsLoading(true);
    setError(null);
    setExerciseSheetContent('');

    try {
      const content = await generateExerciseSheet(
        topic,
        exerciseType,
        difficulty,
        numQuestions
      );
      setExerciseSheetContent(content);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-10">
            <Controls onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <ExerciseSheet 
              content={exerciseSheetContent} 
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;