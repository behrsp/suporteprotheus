import React from 'react';
import { ActiveTab } from '../types';
import { Database, Plus } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenQuickCreate: () => void;
  isDbConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickCreate,
  isDbConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:border-blue-400 transition-colors">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              SUPORTE PROTHEUS
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'dashboard'
                ? 'text-white border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => onTabChange('tables')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'tables'
                ? 'text-white border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tabelas (ALIAS)
          </button>
          <button
            onClick={() => onTabChange('parameters')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'parameters'
                ? 'text-white border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Parâmetros (SX6)
          </button>
          <button
            onClick={() => onTabChange('helps')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'helps'
                ? 'text-white border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Base de HELPs
          </button>
        </nav>

        {/* Zone 3: Primary Action & Database status */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg font-mono"
            title={isDbConnected ? 'Conectado à Neon DB (AWS sa-east-1)' : 'Cache Local Ativo'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDbConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-300">
              {isDbConnected ? 'Neon DB Online' : 'Cache Local'}
            </span>
          </div>

          <button
            onClick={onOpenQuickCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
