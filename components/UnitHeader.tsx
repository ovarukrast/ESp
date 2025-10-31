import React from 'react';
import { PenIcon } from './icons/PenIcon';
import { ColorInfo } from '../utils';

interface UnitHeaderProps {
  title: string;
  instruction: string;
  subtitle?: string;
  color: ColorInfo;
}

export const UnitHeader: React.FC<UnitHeaderProps> = ({ title, instruction, subtitle, color }) => {
  return (
    <div className={`${color.bg} p-6 sm:p-8 flex items-center gap-6 print:hidden`}>
      <div className="flex-shrink-0 bg-white/90 w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
          <div className={color.icon}>
            <PenIcon />
          </div>
      </div>
      <div>
        {subtitle && <p className={`font-semibold ${color.text} text-sm opacity-90 tracking-wider uppercase`}>{subtitle}</p>}
        <h1 className="text-3xl font-extrabold font-display text-white tracking-tight mt-1">{title}</h1>
        <p className={`${color.text} mt-2 text-base`}>{instruction}</p>
      </div>
    </div>
  );
};