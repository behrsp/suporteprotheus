import React, { useState, useMemo } from 'react';
import { TableItem, ParameterItem, HelpItem, ActiveTab } from '../types';
import {
  Database,
  Sliders,
  HelpCircle,
  Search,
  Plus,
  Download,
  Terminal,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
  Check,
  Copy,
} from 'lucide-react';

interface DashboardViewProps {
  tables: TableItem[];
  parameters: ParameterItem[];
  helps: HelpItem[];
  isDbConnected: boolean;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenCreate: (type: 'table' | 'param' | 'help') => void;
  onInspectItem: (type: 'table' | 'param' | 'help', item: any) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tables,
  parameters,
  helps,
  isDbConnected,
  onNavigateTab,
  onOpenCreate,
  onInspectItem,
  onNotify,
}) => {
  const [omniSearch, setOmniSearch] = useState('');
  const [copiedCheat, setCopiedCheat] = useState<string | null>(null);

  // Global search across all 3 databases
  const searchResults = useMemo(() => {
    if (!omniSearch.trim()) return null;
    const q = omniSearch.toLowerCase();

    const matchedTables = tables.filter(
      (t) =>
        t.alias.toLowerCase().includes(q) ||
        t.nome.toLowerCase().includes(q) ||
        (t.descricao && t.descricao.toLowerCase().includes(q))
    );

    const matchedParams = parameters.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.valor.toLowerCase().includes(q) ||
        p.finalidade.toLowerCase().includes(q)
    );

    const matchedHelps = helps.filter(
      (h) =>
        h.nome.toLowerCase().includes(q) ||
        h.descricao.toLowerCase().includes(q) ||
        h.como_solucionar.toLowerCase().includes(q)
    );

    return {
      tables: matchedTables,
      parameters: matchedParams,
      helps: matchedHelps,
      total: matchedTables.length + matchedParams.length + matchedHelps.length,
    };
  }, [omniSearch, tables, parameters, helps]);

  const handleExportBackup = () => {
    const backupData = {
      app: 'SUPORTE PROTHEUS',
      exportDate: new Date().toISOString(),
      tables,
      parameters,
      helps,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_suporte_protheus_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('success', 'Backup Exportado', 'Arquivo JSON com toda a base de suporte baixado.');
  };

  const handleCopyCheat = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCheat(id);
    onNotify('info', 'Copiado', 'Comando copiado para a área de transferência.');
    setTimeout(() => setCopiedCheat(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Hero / Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
            <Server className="w-3.5 h-3.5" />
            <span>CENTRAL DE SUPORTE ERP TOTVS PROTHEUS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Base Técnica de Tabelas, Parâmetros e Resolução de HELPs
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Ambiente unificado para consulta instantânea de ALIAS, dicionário SX6 e guia de correção passo a passo de erros com prints e evidências em tempo real.
          </p>

          {/* Global Omni-Search Input */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Busca global simultânea: digite ALIAS (SA1), Parâmetro (MV_...) ou Help (A410BLOQ)..."
                value={omniSearch}
                onChange={(e) => setOmniSearch(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Results Dropdown/Box if user typed */}
      {searchResults && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              Resultados da Busca Global ({searchResults.total})
            </h3>
            <button
              onClick={() => setOmniSearch('')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Limpar busca
            </button>
          </div>

          {searchResults.total === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Nenhum registro encontrado nas 3 bases para "{omniSearch}".
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tables found */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 uppercase">
                  <Database className="w-3.5 h-3.5" />
                  Tabelas ({searchResults.tables.length})
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {searchResults.tables.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhuma tabela correspondente</p>
                  ) : (
                    searchResults.tables.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onInspectItem('table', t);
                          setOmniSearch('');
                        }}
                        className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-blue-500/50 cursor-pointer text-xs transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-300">{t.alias}</span>
                          <span className="text-[10px] text-slate-400">{t.modulo}</span>
                        </div>
                        <p className="text-slate-200 truncate mt-0.5">{t.nome}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Parameters found */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5 uppercase">
                  <Sliders className="w-3.5 h-3.5" />
                  Parâmetros ({searchResults.parameters.length})
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {searchResults.parameters.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum parâmetro correspondente</p>
                  ) : (
                    searchResults.parameters.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onInspectItem('param', p);
                          setOmniSearch('');
                        }}
                        className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-purple-500/50 cursor-pointer text-xs transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-purple-300">{p.nome}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">{p.valor}</span>
                        </div>
                        <p className="text-slate-300 truncate mt-0.5">{p.finalidade}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Helps found */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase">
                  <HelpCircle className="w-3.5 h-3.5" />
                  HELPs ({searchResults.helps.length})
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {searchResults.helps.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum help correspondente</p>
                  ) : (
                    searchResults.helps.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          onInspectItem('help', h);
                          setOmniSearch('');
                        }}
                        className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer text-xs transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-300">{h.nome}</span>
                          <span className="text-[10px] text-slate-400">{h.modulo}</span>
                        </div>
                        <p className="text-slate-200 truncate mt-0.5">{h.descricao}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tabelas Card */}
        <div
          onClick={() => onNavigateTab('tables')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-blue-500/40 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Tabelas Cadastradas
              </span>
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {tables.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 group-hover:text-blue-300">
            <span>Explorar catálogo de ALIAS</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Parâmetros Card */}
        <div
          onClick={() => onNavigateTab('parameters')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-purple-500/40 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Parâmetros SX6
              </span>
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {parameters.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400 group-hover:text-purple-300">
            <span>Consultar variáveis MV_*</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Helps Card */}
        <div
          onClick={() => onNavigateTab('helps')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Base de HELPs & Soluções
              </span>
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {helps.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 group-hover:text-amber-300">
            <span>Acessar guia de correções</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Actions & Database Status Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fast Action Buttons */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Ações Rápidas de Cadastro
            </h3>
            <button
              onClick={handleExportBackup}
              className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar Backup (JSON)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onOpenCreate('table')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-105 transition-transform">
                <Database className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-white">Cadastrar Tabela</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ALIAS, nome e chaves</p>
            </button>

            <button
              onClick={() => onOpenCreate('param')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all text-left group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-105 transition-transform">
                <Sliders className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-white">Cadastrar Parâmetro</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Nome, tipo, valor e finalidade</p>
            </button>

            <button
              onClick={() => onOpenCreate('help')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-white">Cadastrar Help</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Erro, solução e upload de print</p>
            </button>
          </div>
        </div>

        {/* Persistence Status Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Persistência de Dados
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  isDbConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isDbConnected ? 'Neon DB Online' : 'Cache Local'}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white">
              {isDbConnected ? 'Neon PostgreSQL Conectado' : 'Modo Offline / Local'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {isDbConnected
                ? 'Conexão ativa com o banco gerenciado Neon na região sa-east-1. Todos os cadastros e prints são gravados na nuvem.'
                : 'Operando com cache seguro. Reconectando automaticamente ao banco de dados.'}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 truncate">
            <span>neondb_owner@ep-spring-union...aws.neon.tech</span>
          </div>
        </div>
      </div>

      {/* Cheatsheet: TOTVS Protheus IT Support Quick Reference */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Guia Rápido de Suporte AdvPL & SQL
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-blue-400 font-mono block">
              SA* · Cadastros
            </span>
            <p className="text-xs text-slate-300">
              <strong>SA1:</strong> Clientes · <strong>SA2:</strong> Fornecedores · <strong>SA3:</strong> Vendedores
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 font-mono block">
              SC* / SD* · Faturamento
            </span>
            <p className="text-xs text-slate-300">
              <strong>SC5/SC6:</strong> Pedidos · <strong>SF1/SD1:</strong> NF Entrada · <strong>SF2/SD2:</strong> NF Saída
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 font-mono block">
              SE* / CT* · Fin & Contab
            </span>
            <p className="text-xs text-slate-300">
              <strong>SE1:</strong> A Receber · <strong>SE2:</strong> A Pagar · <strong>CT2:</strong> Lançamentos Contábeis
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-purple-400 font-mono block">
              SX* · Dicionário
            </span>
            <p className="text-xs text-slate-300">
              <strong>SX2:</strong> Tabelas · <strong>SX3:</strong> Campos · <strong>SX6:</strong> Parâmetros
            </p>
          </div>
        </div>

        {/* Useful queries */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Exemplo de Query SQL padrão:</span>
            <code className="text-emerald-400 font-mono block">
              SELECT * FROM SA1010 WHERE D_E_L_E_T_ = ' ' AND A1_COD = '000001';
            </code>
          </div>
          <button
            onClick={() =>
              handleCopyCheat(
                "SELECT * FROM SA1010 WHERE D_E_L_E_T_ = ' ' AND A1_COD = '000001';",
                'q1'
              )
            }
            className="self-start sm:self-auto px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            {copiedCheat === 'q1' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copiar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
