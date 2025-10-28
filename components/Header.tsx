
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md print:hidden">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-blue-600">🇪🇸</span>
            <h1 className="text-2xl font-bold text-slate-800">
            Generador de Fichas de Español
            </h1>
        </div>
      </div>
    </header>
  );
};
