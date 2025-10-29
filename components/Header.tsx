import React from 'react';
import { FlagIcon } from './icons/FlagIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10 print:hidden">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
            <FlagIcon />
            <h1 className="text-lg font-semibold text-gray-900">
            Generador de Fichas de Español
            </h1>
        </div>
      </div>
    </header>
  );
};
