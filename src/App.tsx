import React, { useState, useEffect, useCallback } from 'react';
import { TableItem, ParameterItem, HelpItem, ActiveTab, SystemStats } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { DashboardView } from './components/DashboardView';
import { TablesView } from './components/TablesView';
import { ParametersView } from './components/ParametersView';
import { HelpsView } from './components/HelpsView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ImageLightbox } from './components/ImageLightbox';
import { Database, Sliders, HelpCircle, X, Plus } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [tables, setTables] = useState<TableItem[]>([]);
  const [parameters, setParameters] = useState<ParameterItem[]>([]);
  const [helps, setHelps] = useState<HelpItem[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Image Lightbox
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title?: string;
  }>({
    isOpen: false,
    imageUrl: null,
  });

  // Quick Create Selector Modal
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Notification helper
  const addToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Data Fetch
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tablesData, paramsData, helpsData, statsData] = await Promise.all([
        api.getTables(),
        api.getParameters(),
        api.getHelps(),
        api.getStats().catch(() => ({ isDbConnected: false } as SystemStats)),
      ]);

      setTables(tablesData);
      setParameters(paramsData);
      setHelps(helpsData);
      setIsDbConnected(statsData.isDbConnected);
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Erro ao carregar dados', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Table Handlers
  const handleCreateTable = async (data: Omit<TableItem, 'id'>) => {
    const created = await api.createTable(data);
    setTables((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
  };

  const handleUpdateTable = async (id: number, data: Partial<TableItem>) => {
    const updated = await api.updateTable(id, data);
    setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleDeleteTable = async (id: number) => {
    await api.deleteTable(id);
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  // Parameter Handlers
  const handleCreateParameter = async (data: Omit<ParameterItem, 'id'>) => {
    const created = await api.createParameter(data);
    setParameters((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
  };

  const handleUpdateParameter = async (id: number, data: Partial<ParameterItem>) => {
    const updated = await api.updateParameter(id, data);
    setParameters((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDeleteParameter = async (id: number) => {
    await api.deleteParameter(id);
    setParameters((prev) => prev.filter((p) => p.id !== id));
  };

  // Help Handlers
  const handleCreateHelp = async (data: Omit<HelpItem, 'id'>) => {
    const created = await api.createHelp(data);
    setHelps((prev) => [created, ...prev.filter((h) => h.id !== created.id)]);
  };

  const handleUpdateHelp = async (id: number, data: Partial<HelpItem>) => {
    const updated = await api.updateHelp(id, data);
    setHelps((prev) => prev.map((h) => (h.id === id ? updated : h)));
  };

  const handleDeleteHelp = async (id: number) => {
    await api.deleteHelp(id);
    setHelps((prev) => prev.filter((h) => h.id !== id));
  };

  // Open Lightbox
  const handleOpenLightbox = (imageUrl: string, title?: string) => {
    setLightbox({ isOpen: true, imageUrl, title });
  };

  const handleCloseLightbox = () => {
    setLightbox({ isOpen: false, imageUrl: null });
  };

  // Inspector from Omni-Search
  const handleInspectItem = (type: 'table' | 'param' | 'help', item: any) => {
    if (type === 'table') {
      setActiveTab('tables');
    } else if (type === 'param') {
      setActiveTab('parameters');
    } else if (type === 'help') {
      setActiveTab('helps');
    }
  };

  const handleOpenCreateCategory = (category: 'table' | 'param' | 'help') => {
    setQuickCreateOpen(false);
    if (category === 'table') {
      setActiveTab('tables');
    } else if (category === 'param') {
      setActiveTab('parameters');
    } else if (category === 'help') {
      setActiveTab('helps');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickCreate={() => setQuickCreateOpen(true)}
        isDbConnected={isDbConnected}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            tables={tables}
            parameters={parameters}
            helps={helps}
            isDbConnected={isDbConnected}
            onNavigateTab={setActiveTab}
            onOpenCreate={handleOpenCreateCategory}
            onInspectItem={handleInspectItem}
            onNotify={addToast}
          />
        )}

        {activeTab === 'tables' && (
          <TablesView
            tables={tables}
            isLoading={isLoading}
            onCreate={handleCreateTable}
            onUpdate={handleUpdateTable}
            onDelete={handleDeleteTable}
            onNotify={addToast}
          />
        )}

        {activeTab === 'parameters' && (
          <ParametersView
            parameters={parameters}
            isLoading={isLoading}
            onCreate={handleCreateParameter}
            onUpdate={handleUpdateParameter}
            onDelete={handleDeleteParameter}
            onNotify={addToast}
          />
        )}

        {activeTab === 'helps' && (
          <HelpsView
            helps={helps}
            isLoading={isLoading}
            onCreate={handleCreateHelp}
            onUpdate={handleUpdateHelp}
            onDelete={handleDeleteHelp}
            onNotify={addToast}
            onOpenLightbox={handleOpenLightbox}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Quick Create Selector Modal */}
      {quickCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setQuickCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              O que você deseja cadastrar?
            </h3>
            <p className="text-xs text-slate-400">
              Escolha a seção para incluir um novo registro de suporte ao Protheus.
            </p>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <button
                onClick={() => handleOpenCreateCategory('table')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Tabela do Protheus</h4>
                  <p className="text-xs text-slate-400">Cadastre ALIAS, nome da tabela e chaves</p>
                </div>
              </button>

              <button
                onClick={() => handleOpenCreateCategory('param')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500 hover:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Parâmetro SX6</h4>
                  <p className="text-xs text-slate-400">Nome (MV_*), tipo, valor e finalidade</p>
                </div>
              </button>

              <button
                onClick={() => handleOpenCreateCategory('help')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 hover:bg-slate-900 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Help do Sistema</h4>
                  <p className="text-xs text-slate-400">Código do erro, solução e upload de prints</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for zooming prints */}
      <ImageLightbox
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.imageUrl}
        imageTitle={lightbox.title}
        onClose={handleCloseLightbox}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
