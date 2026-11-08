import React, { useState, useMemo } from 'react';
import { TableItem } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Filter,
  Eye,
  X,
  Code2,
  Layers,
  Database,
  ArrowUpDown,
} from 'lucide-react';

interface TablesViewProps {
  tables: TableItem[];
  isLoading: boolean;
  onCreate: (table: Omit<TableItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: number, table: Partial<TableItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

const COMMON_MODULES = [
  'Todos',
  'FAT - Faturamento',
  'COM - Compras',
  'EST - Estoque',
  'FIN - Financeiro',
  'CTB - Contabilidade',
  'FIS - Livros Fiscais',
  'CFG - Configurador',
  'RH - Gestão de Pessoal',
];

export const TablesView: React.FC<TablesViewProps> = ({
  tables,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onNotify,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('Todos');
  const [sortBy, setSortBy] = useState<'alias-asc' | 'alias-desc' | 'nome-asc'>('alias-asc');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [inspectTable, setInspectTable] = useState<TableItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<TableItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    alias: '',
    nome: '',
    modulo: 'FAT - Faturamento',
    descricao: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  // Filtered and sorted tables
  const filteredTables = useMemo(() => {
    return tables
      .filter((t) => {
        const matchesSearch =
          t.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.descricao && t.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesModule =
          selectedModule === 'Todos' ||
          (t.modulo && t.modulo.toLowerCase().includes(selectedModule.toLowerCase().split(' - ')[0]));

        return matchesSearch && matchesModule;
      })
      .sort((a, b) => {
        if (sortBy === 'alias-asc') return a.alias.localeCompare(b.alias);
        if (sortBy === 'alias-desc') return b.alias.localeCompare(a.alias);
        if (sortBy === 'nome-asc') return a.nome.localeCompare(b.nome);
        return 0;
      });
  }, [tables, searchTerm, selectedModule, sortBy]);

  const handleOpenCreate = () => {
    setEditingTable(null);
    setFormData({
      alias: '',
      nome: '',
      modulo: 'FAT - Faturamento',
      descricao: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (table: TableItem) => {
    setEditingTable(table);
    setFormData({
      alias: table.alias,
      nome: table.nome,
      modulo: table.modulo || 'Geral',
      descricao: table.descricao || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.alias.trim() || !formData.nome.trim()) {
      onNotify('warning', 'Campos Obrigatórios', 'Preencha o ALIAS e o NOME da tabela.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTable) {
        await onUpdate(editingTable.id, formData);
        onNotify('success', 'Tabela Atualizada', `Tabela ${formData.alias.toUpperCase()} alterada com sucesso.`);
      } else {
        await onCreate(formData);
        onNotify('success', 'Tabela Cadastrada', `Tabela ${formData.alias.toUpperCase()} incluída com sucesso.`);
      }
      setIsModalOpen(false);
      setEditingTable(null);
    } catch (err: any) {
      onNotify('error', 'Erro ao Salvar', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setIsSubmitting(true);
    try {
      await onDelete(deleteCandidate.id);
      onNotify('success', 'Tabela Excluída', `Tabela ${deleteCandidate.alias} foi removida.`);
      setDeleteCandidate(null);
      if (inspectTable?.id === deleteCandidate.id) {
        setInspectTable(null);
      }
    } catch (err: any) {
      onNotify('error', 'Erro ao Excluir', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAlias = (alias: string, id: number) => {
    navigator.clipboard.writeText(alias);
    setCopiedId(id);
    onNotify('info', 'Alias Copiado', `"${alias}" copiado para a área de transferência.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySql = (alias: string) => {
    const query = `SELECT * FROM ${alias}010 WHERE D_E_L_E_T_ = ' ' ORDER BY R_E_C_N_O_ DESC;`;
    navigator.clipboard.writeText(query);
    setCopiedQuery(true);
    onNotify('info', 'Query SQL Copiada', 'Query SQL copiada para área de transferência.');
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Tabelas do Protheus
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Catálogo técnico de ALIAS do dicionário Protheus, chaves de busca e queries em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tabela</span>
          </button>
        </div>
      </div>

      {/* Dynamic Search & Filters Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Real-time search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por ALIAS (ex: SA1, SB1) ou Nome da tabela..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Module Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-48">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {COMMON_MODULES.map((mod) => (
                  <option key={mod} value={mod} className="bg-slate-900 text-slate-200">
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                aria-label="Ordenar por"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="alias-asc" className="bg-slate-900">ALIAS (A-Z)</option>
                <option value="alias-desc" className="bg-slate-900">ALIAS (Z-A)</option>
                <option value="nome-asc" className="bg-slate-900">Nome (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Counter & quick filters */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong className="text-slate-200 tabular-nums">{filteredTables.length}</strong> de{' '}
              <span className="tabular-nums">{tables.length}</span> tabelas
            </span>
            {searchTerm && (
              <>
                <span>·</span>
                <span className="text-blue-400 truncate max-w-[200px]">Filtro: "{searchTerm}"</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Desktop Table & Mobile Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando tabelas do Protheus...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800/80">
          <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Nenhuma tabela encontrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {searchTerm
              ? `Não foram encontrados registros para "${searchTerm}". Tente outro termo.`
              : 'Cadastre a primeira tabela do Protheus com ALIAS e NOME.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Tabela
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/90 text-slate-400 text-xs uppercase font-medium border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-28">ALIAS</th>
                  <th className="py-3 px-4">Nome da Tabela</th>
                  <th className="py-3 px-4 w-44">Módulo</th>
                  <th className="py-3 px-4">Descrição / Chaves</th>
                  <th className="py-3 px-4 text-right w-40">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTables.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setInspectTable(t)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded text-xs">
                          {t.alias}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAlias(t.alias, t.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                          title="Copiar ALIAS"
                        >
                          {copiedId === t.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-100 font-medium whitespace-nowrap">
                      {t.nome}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-xs">
                      {t.modulo || 'Geral'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs truncate max-w-xs">
                      {t.descricao || 'Sem descrição cadastrada'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setInspectTable(t)}
                          className="p-1.5 text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                          title="Visualização Rápida"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
                          title="Alterar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(t)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3 pb-16">
            {filteredTables.map((t) => (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-sm active:border-slate-700"
                onClick={() => setInspectTable(t)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm bg-blue-500/15 text-blue-300 border border-blue-500/25 px-2 py-0.5 rounded">
                      {t.alias}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAlias(t.alias, t.id);
                      }}
                      className="p-1 text-slate-400 active:text-white"
                      title="Copiar ALIAS"
                    >
                      {copiedId === t.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {t.modulo || 'Geral'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{t.nome}</h4>
                  {t.descricao && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {t.descricao}
                    </p>
                  )}
                </div>

                <div
                  className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setInspectTable(t)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalhes</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 text-slate-400 hover:text-amber-300 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(t)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* QUICK VIEW DRAWER / MODAL */}
      {inspectTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setInspectTable(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-lg">
                {inspectTable.alias}
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">{inspectTable.nome}</h3>
                <p className="text-xs text-slate-400">{inspectTable.modulo || 'Geral'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Descrição Técnica & Chaves
                </span>
                <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {inspectTable.descricao || 'Nenhuma chave ou observação adicional cadastrada.'}
                </p>
              </div>

              {/* SQL Query Quick Helper */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-blue-400" />
                    Query SQL Protheus (Padrão)
                  </span>
                  <button
                    onClick={() => handleCopySql(inspectTable.alias)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
                  >
                    {copiedQuery ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Query</span>
                  </button>
                </div>
                <code className="text-xs font-mono text-emerald-400 block bg-slate-900/90 p-2.5 rounded border border-slate-800 overflow-x-auto">
                  SELECT * FROM {inspectTable.alias}010 WHERE D_E_L_E_T_ = ' ' ORDER BY R_E_C_N_O_ DESC;
                </code>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleCopyAlias(inspectTable.alias, inspectTable.id)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar ALIAS
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const t = inspectTable;
                    setInspectTable(null);
                    handleOpenEdit(t);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                >
                  Alterar
                </button>
                <button
                  onClick={() => setInspectTable(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              {editingTable ? 'Alterar Tabela Protheus' : 'Cadastrar Nova Tabela Protheus'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ALIAS *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Ex: SA1"
                    value={formData.alias}
                    onChange={(e) => setFormData({ ...formData, alias: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono uppercase text-blue-400 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Tabela *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clientes"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Módulo Protheus
                </label>
                <input
                  type="text"
                  placeholder="Ex: FAT - Faturamento, COM - Compras"
                  value={formData.modulo}
                  onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                  list="modules-list"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
                <datalist id="modules-list">
                  {COMMON_MODULES.filter((m) => m !== 'Todos').map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição Técnica & Chaves de Busca
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Cadastro mestre de clientes. Chave primária: A1_FILIAL + A1_COD + A1_LOJA."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-all shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingTable ? 'Salvar Alterações' : 'Cadastrar Tabela'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Tabela</h3>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Deseja realmente excluir a tabela <strong className="text-white font-mono">{deleteCandidate.alias}</strong> (
              {deleteCandidate.nome}) da base de suporte?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
