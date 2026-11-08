import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, Database, Sliders, HelpCircle } from 'lucide-react';

interface MobileNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Geral', icon: LayoutDashboard },
    { id: 'tables' as ActiveTab, label: 'Tabelas', icon: Database },
    { id: 'parameters' as ActiveTab, label: 'Parâmetros', icon: Sliders },
    { id: 'helps' as ActiveTab, label: 'HELPs', icon: HelpCircle },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-lg px-2 py-1.5 safe-area-pb">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400 scale-105' : 'text-slate-400'}`} />
              <span className="text-[11px] mt-1 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
