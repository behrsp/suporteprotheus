import React, { useState, useMemo } from 'react';
import { ParameterItem, ParameterType } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Filter,
  Sliders,
  X,
  Eye,
  Calendar,
  ToggleLeft,
  Type,
  Binary,
  Hash,
} from 'lucide-react';

interface ParametersViewProps {
  parameters: ParameterItem[];
  isLoading: boolean;
  onCreate: (param: Omit<ParameterItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: number, param: Partial<ParameterItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

const PARAMETER_TYPES: { label: string; value: ParameterType; icon: any }[] = [
  { label: 'Lógico', value: 'Logico', icon: ToggleLeft },
  { label: 'Caracter', value: 'Caracter', icon: Type },
  { label: 'Data', value: 'data', icon: Calendar },
  { label: 'Número', value: 'numero', icon: Hash },
];

export const ParametersView: React.FC<ParametersViewProps> = ({
  parameters,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onNotify,
}) => {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedModule, setSelectedModule] = useState<string>('Todos');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<ParameterItem | null>(null);
  const [inspectParam, setInspectParam] = useState<ParameterItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ParameterItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nome: string;
    tipo: ParameterType;
    valor: string;
    finalidade: string;
    modulo: string;
  }>({
    nome: '',
    tipo: 'Logico',
    valor: '.T.',
    finalidade: '',
    modulo: 'FAT - Faturamento',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Filtered and sorted parameters
  const filteredParameters = useMemo(() => {
    return parameters.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.valor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.finalidade.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        selectedType === 'Todos' || p.tipo.toLowerCase() === selectedType.toLowerCase();

      const matchesModule =
        selectedModule === 'Todos' ||
        (p.modulo && p.modulo.toLowerCase().includes(selectedModule.toLowerCase().split(' - ')[0]));

      return matchesSearch && matchesType && matchesModule;
    });
  }, [parameters, searchTerm, selectedType, selectedModule]);

  const handleOpenCreate = () => {
    setEditingParam(null);
    setFormData({
      nome: 'MV_',
      tipo: 'Logico',
      valor: '.T.',
      finalidade: '',
      modulo: 'FAT - Faturamento',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (param: ParameterItem) => {
    setEditingParam(param);
    setFormData({
      nome: param.nome,
      tipo: param.tipo,
      valor: param.valor,
      finalidade: param.finalidade,
      modulo: param.modulo || 'Geral',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.finalidade.trim() || formData.valor === undefined) {
      onNotify('warning', 'Campos Obrigatórios', 'Preencha NOME, TIPO, VALOR e FINALIDADE.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingParam) {
        await onUpdate(editingParam.id, formData);
        onNotify('success', 'Parâmetro Atualizado', `Parâmetro ${formData.nome} atualizado.`);
      } else {
        await onCreate(formData);
        onNotify('success', 'Parâmetro Cadastrado', `Parâmetro ${formData.nome} incluído com sucesso.`);
      }
      setIsModalOpen(false);
      setEditingParam(null);
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
      onNotify('success', 'Parâmetro Excluído', `Parâmetro ${deleteCandidate.nome} foi excluído.`);
      setDeleteCandidate(null);
      if (inspectParam?.id === deleteCandidate.id) {
        setInspectParam(null);
      }
    } catch (err: any) {
      onNotify('error', 'Erro ao Excluir', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyName = (name: string, id: number) => {
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    onNotify('info', 'Nome Copiado', `"${name}" copiado para a área de transferência.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'logico':
        return <ToggleLeft className="w-3.5 h-3.5 text-emerald-400" />;
      case 'caracter':
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case 'data':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case 'numero':
        return <Hash className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Binary className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'logico':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'caracter':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'data':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'numero':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            Parâmetros do Sistema (SX6)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cadastro e documentação das variáveis MV_* com tipagem rigorosa (Lógico, Caracter, Data, Número) e finalidade técnica.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Parâmetro</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Dynamic Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome (ex: MV_ESTNEG), valor ou finalidade..."
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

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedType('Todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === 'Todos'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Todos Tipos
            </button>
            {PARAMETER_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedType === t.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {renderTypeIcon(t.value)}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Exibindo <strong className="text-slate-200 tabular-nums">{filteredParameters.length}</strong> de{' '}
            <span className="tabular-nums">{parameters.length}</span> parâmetros
          </span>
          {selectedType !== 'Todos' && (
            <span className="text-blue-400 font-medium">Filtrado por: {selectedType}</span>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando parâmetros do Protheus...</p>
        </div>
      ) : filteredParameters.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800/80">
          <Sliders className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Nenhum parâmetro encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {searchTerm
              ? `Não foram encontrados parâmetros para "${searchTerm}".`
              : 'Cadastre o primeiro parâmetro do Protheus com NOME, TIPO, VALOR e FINALIDADE.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Parâmetro
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/90 text-slate-400 text-xs uppercase font-medium border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-48">Nome (SX6)</th>
                  <th className="py-3 px-4 w-28">Tipo</th>
                  <th className="py-3 px-4 w-36">Valor Configurado</th>
                  <th className="py-3 px-4">Finalidade da Configuração</th>
                  <th className="py-3 px-4 text-right w-36">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredParameters.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setInspectParam(p)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-purple-300">{p.nome}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyName(p.nome, p.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                          title="Copiar Nome"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeBadgeClass(
                          p.tipo
                        )}`}
                      >
                        {renderTypeIcon(p.tipo)}
                        {p.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 text-xs font-medium whitespace-nowrap">
                      <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {p.valor}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs leading-relaxed max-w-md truncate">
                      {p.finalidade}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setInspectParam(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                          title="Visualização Rápida"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
                          title="Alterar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(p)}
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 pb-16">
            {filteredParameters.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-sm active:border-slate-700"
                onClick={() => setInspectParam(p)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-purple-300">{p.nome}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyName(p.nome, p.id);
                      }}
                      className="p-1 text-slate-400 active:text-white"
                      title="Copiar Nome"
                    >
                      {copiedId === p.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeBadgeClass(
                      p.tipo
                    )}`}
                  >
                    {renderTypeIcon(p.tipo)}
                    {p.tipo}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Valor:</span>
                  <span className="font-mono font-medium text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {p.valor}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {p.finalidade}
                </p>

                <div
                  className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setInspectParam(p)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalhes</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-amber-300 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(p)}
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

      {/* QUICK VIEW INSPECT MODAL */}
      {inspectParam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setInspectParam(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pr-8">
              <div>
                <h3 className="text-lg font-mono font-bold text-purple-300 flex items-center gap-2">
                  {inspectParam.nome}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{inspectParam.modulo || 'Configuração Geral'}</p>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${getTypeBadgeClass(
                  inspectParam.tipo
                )}`}
              >
                {renderTypeIcon(inspectParam.tipo)}
                {inspectParam.tipo}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Valor Atual / Conteúdo
                </span>
                <span className="font-mono text-emerald-400 text-sm font-semibold bg-slate-900 px-3 py-1.5 rounded border border-slate-800 inline-block">
                  {inspectParam.valor}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Finalidade da Configuração
                </span>
                <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {inspectParam.finalidade}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleCopyName(inspectParam.nome, inspectParam.id)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Nome
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const p = inspectParam;
                    setInspectParam(null);
                    handleOpenEdit(p);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                >
                  Alterar
                </button>
                <button
                  onClick={() => setInspectParam(null)}
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              {editingParam ? 'Alterar Parâmetro SX6' : 'Cadastrar Parâmetro do Sistema'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NOME DO PARÂMETRO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MV_ESTNEG"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-purple-300 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* TIPO Selector (Required: Logico, Caracter, data, numero) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  TIPO DO PARÂMETRO *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PARAMETER_TYPES.map((t) => {
                    const isSelected = formData.tipo === t.value;
                    const Icon = t.icon;
                    return (
                      <button
                        type="button"
                        key={t.value}
                        onClick={() => {
                          let defaultVal = formData.valor;
                          if (t.value === 'Logico' && defaultVal !== '.T.' && defaultVal !== '.F.' && defaultVal !== 'N' && defaultVal !== 'S') {
                            defaultVal = '.T.';
                          } else if (t.value === 'data' && !defaultVal.includes('/')) {
                            defaultVal = '31/12/2026';
                          } else if (t.value === 'numero' && isNaN(Number(defaultVal))) {
                            defaultVal = '1';
                          }
                          setFormData({ ...formData, tipo: t.value, valor: defaultVal });
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VALOR Input with smart presets based on TIPO */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    VALOR DO PARÂMETRO *
                  </label>
                  {formData.tipo === 'Logico' && (
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, valor: '.T.' })}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white font-mono"
                      >
                        .T.
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, valor: '.F.' })}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white font-mono"
                      >
                        .F.
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, valor: 'S' })}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white font-mono"
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, valor: 'N' })}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white font-mono"
                      >
                        N
                      </button>
                    </div>
                  )}
                </div>

                {formData.tipo === 'Logico' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, valor: '.T.' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-colors ${
                        formData.valor === '.T.' || formData.valor === 'S'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      .T. / Ativado (Sim)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, valor: '.F.' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-colors ${
                        formData.valor === '.F.' || formData.valor === 'N'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      .F. / Desativado (Não)
                    </button>
                  </div>
                ) : formData.tipo === 'numero' ? (
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Ex: 30"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                ) : formData.tipo === 'data' ? (
                  <input
                    type="text"
                    required
                    placeholder="Ex: 31/12/2026 ou 20261231"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Ex: Conteúdo ou código caracter"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Módulo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Módulo Relacionado
                </label>
                <input
                  type="text"
                  placeholder="Ex: FAT - Faturamento, EST - Estoque"
                  value={formData.modulo}
                  onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* FINALIDADE (Required) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  FINALIDADE DE CADA CONFIGURAÇÃO *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explique detalhadamente o objetivo desta configuração, regras de negócio e impactos no ERP..."
                  value={formData.finalidade}
                  onChange={(e) => setFormData({ ...formData, finalidade: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
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
                  {isSubmitting ? 'Salvando...' : editingParam ? 'Salvar Alterações' : 'Cadastrar Parâmetro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Parâmetro</h3>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Deseja realmente excluir o parâmetro <strong className="text-white font-mono">{deleteCandidate.nome}</strong> da base de suporte?
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
