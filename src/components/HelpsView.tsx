import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HelpItem, HelpImage } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  HelpCircle,
  X,
  Upload,
  Image as ImageIcon,
  Eye,
  Maximize2,
  AlertCircle,
  BookOpen,
  FileText,
  Share2,
} from 'lucide-react';

interface HelpsViewProps {
  helps: HelpItem[];
  isLoading: boolean;
  onCreate: (help: Omit<HelpItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: number, help: Partial<HelpItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
  onOpenLightbox: (imageUrl: string, title?: string) => void;
}

export const HelpsView: React.FC<HelpsViewProps> = ({
  helps,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onNotify,
  onOpenLightbox,
}) => {
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('Todos');

  // Modals & Viewers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHelp, setEditingHelp] = useState<HelpItem | null>(null);
  const [inspectHelp, setInspectHelp] = useState<HelpItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<HelpItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nome: string;
    descricao: string;
    como_solucionar: string;
    modulo: string;
    imagens: HelpImage[];
  }>({
    nome: '',
    descricao: '',
    como_solucionar: '',
    modulo: 'FAT - Faturamento',
    imagens: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste listener for clipboard screenshots
  useEffect(() => {
    if (!isModalOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            handleProcessImageBlob(blob, 'Print_Clipboard.png');
            onNotify('info', 'Print Colado', 'Imagem da área de transferência anexada com sucesso!');
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isModalOpen]);

  // Image resizing & processing to optimize storage in Neon DB
  const handleProcessImageBlob = (blob: Blob, fileName: string) => {
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          const newImg: HelpImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: fileName,
            dataUrl: compressedDataUrl,
            uploadedAt: new Date().toISOString(),
          };

          setFormData((prev) => ({
            ...prev,
            imagens: [...prev.imagens, newImg],
          }));
        }
        setIsUploadingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(blob);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        handleProcessImageBlob(file, file.name);
      } else {
        onNotify('warning', 'Arquivo Inválido', 'Selecione apenas arquivos de imagem (PNG, JPG, WEBP).');
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imgId: string) => {
    setFormData((prev) => ({
      ...prev,
      imagens: prev.imagens.filter((img) => img.id !== imgId),
    }));
  };

  // Filtered helps
  const filteredHelps = useMemo(() => {
    return helps.filter((h) => {
      const matchesSearch =
        h.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.como_solucionar.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesModule =
        selectedModule === 'Todos' ||
        (h.modulo && h.modulo.toLowerCase().includes(selectedModule.toLowerCase().split(' - ')[0]));

      return matchesSearch && matchesModule;
    });
  }, [helps, searchTerm, selectedModule]);

  const handleOpenCreate = () => {
    setEditingHelp(null);
    setFormData({
      nome: '',
      descricao: '',
      como_solucionar: '',
      modulo: 'FAT - Faturamento',
      imagens: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (help: HelpItem) => {
    setEditingHelp(help);
    setFormData({
      nome: help.nome,
      descricao: help.descricao,
      como_solucionar: help.como_solucionar,
      modulo: help.modulo || 'Geral',
      imagens: help.imagens || [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.descricao.trim() || !formData.como_solucionar.trim()) {
      onNotify('warning', 'Campos Obrigatórios', 'Preencha o NOME do Help, a DESCRIÇÃO e COMO SOLUCIONAR.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingHelp) {
        await onUpdate(editingHelp.id, formData);
        onNotify('success', 'Help Atualizado', `Help ${formData.nome} atualizado com sucesso.`);
      } else {
        await onCreate(formData);
        onNotify('success', 'Help Cadastrado', `Help ${formData.nome} incluído na base de conhecimento.`);
      }
      setIsModalOpen(false);
      setEditingHelp(null);
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
      onNotify('success', 'Help Excluído', `Help ${deleteCandidate.nome} removido.`);
      setDeleteCandidate(null);
      if (inspectHelp?.id === deleteCandidate.id) {
        setInspectHelp(null);
      }
    } catch (err: any) {
      onNotify('error', 'Erro ao Excluir', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyHelpCode = (name: string, id: number) => {
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    onNotify('info', 'Código Copiado', `"${name}" copiado para a área de transferência.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySolutionText = (solutionText: string) => {
    navigator.clipboard.writeText(solutionText);
    setCopiedSolution(true);
    onNotify('info', 'Solução Copiada', 'Texto de resolução copiado com sucesso.');
    setTimeout(() => setCopiedSolution(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            Base de Conhecimento de HELPs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Catálogo de erros, mensagens de bloqueio e passo a passo de correção com suporte a prints e evidências.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Help</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por código de help (ex: A410BLOQ), erro ou solução..."
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
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Exibindo <strong className="text-slate-200 tabular-nums">{filteredHelps.length}</strong> de{' '}
            <span className="tabular-nums">{helps.length}</span> HELPs documentados
          </span>
          {searchTerm && <span className="text-blue-400">Filtro ativo</span>}
        </div>
      </div>

      {/* Helps Grid / Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando base de HELPs do Protheus...</p>
        </div>
      ) : filteredHelps.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800/80">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Nenhum Help encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {searchTerm
              ? `Nenhum Help encontrado para a busca "${searchTerm}".`
              : 'Cadastre o primeiro Help com NOME, DESCRIÇÃO, COMO SOLUCIONAR e prints.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Help
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-16">
          {filteredHelps.map((help) => (
            <div
              key={help.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group"
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2.5 py-1 rounded-lg">
                      {help.nome}
                    </span>
                    <button
                      onClick={() => handleCopyHelpCode(help.nome, help.id)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copiar código do Help"
                    >
                      {copiedId === help.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {help.modulo || 'Geral'}
                    </span>
                  </div>
                </div>

                {/* Problem Description */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Descrição do Erro
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                    {help.descricao}
                  </p>
                </div>

                {/* Solution Summary */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-emerald-400" />
                    Como Solucionar
                  </span>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line font-sans">
                    {help.como_solucionar}
                  </p>
                </div>

                {/* Image Thumbnails if any */}
                {help.imagens && help.imagens.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-blue-400" />
                      Prints & Evidências ({help.imagens.length})
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {help.imagens.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          onClick={() => onOpenLightbox(img.dataUrl, `Print ${idx + 1} - ${help.nome}`)}
                          className="relative group/thumb cursor-pointer shrink-0 rounded-lg overflow-hidden border border-slate-800 hover:border-blue-500 transition-all w-20 h-14 bg-slate-950"
                        >
                          <img
                            src={img.dataUrl}
                            alt={`Print ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

                {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => setInspectHelp(help)}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Detalhes Completos</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(help)}
                    className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors cursor-pointer"
                    title="Alterar Help"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteCandidate(help)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                    title="Excluir Help"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL INSPECTION MODAL */}
      {inspectHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectHelp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg">
                {inspectHelp.nome}
              </span>
              <div>
                <span className="text-xs text-slate-400 block">{inspectHelp.modulo || 'Geral'}</span>
                <span className="text-xs text-slate-500">Documentação de Suporte</span>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Problem */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                  Descrição do Erro / Sintoma Apresentado
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {inspectHelp.descricao}
                </p>
              </div>

              {/* Solution */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                    Como Solucionar (Passo a Passo)
                  </span>
                  <button
                    onClick={() => handleCopySolutionText(inspectHelp.como_solucionar)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                  >
                    {copiedSolution ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar Solução</span>
                  </button>
                </div>
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 font-sans">
                  {inspectHelp.como_solucionar}
                </div>
              </div>

              {/* Images */}
              {inspectHelp.imagens && inspectHelp.imagens.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Prints e Evidências Salvas ({inspectHelp.imagens.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {inspectHelp.imagens.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        onClick={() => onOpenLightbox(img.dataUrl, `Print ${idx + 1} - ${inspectHelp.nome}`)}
                        className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-800 bg-slate-950 hover:border-blue-500 transition-all aspect-video"
                      >
                        <img
                          src={img.dataUrl}
                          alt={`Print ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-medium">
                          <Maximize2 className="w-4 h-4" />
                          <span>Ver em Tela Cheia</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleCopyHelpCode(inspectHelp.nome, inspectHelp.id)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Código do Help
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const h = inspectHelp;
                    setInspectHelp(null);
                    handleOpenEdit(h);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
                >
                  Alterar
                </button>
                <button
                  onClick={() => setInspectHelp(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              {editingHelp ? 'Alterar Help / Erro Protheus' : 'Cadastrar Help / Base de Conhecimento'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CÓDIGO DO HELP / NOME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: A410BLOQ"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 uppercase placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Módulo do Sistema
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: FAT - Faturamento, FIN - Financeiro"
                    value={formData.modulo}
                    onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* DESCRIÇÃO (Required) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  DESCRIÇÃO DO PROBLEMA / SINTOMA *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Descreva quando o Help é disparado, rotina correspondente e a mensagem exibida na tela..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* COMO SOLUCIONAR (Caixa de texto explicada - Required) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>COMO SOLUCIONAR (Explicação detalhada da correção) *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Passo a passo, rotinas e tabelas</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="1. Acesse o módulo e rotina X&#10;2. Verifique o campo Y na tabela Z&#10;3. Execute o procedimento de ajuste..."
                  value={formData.como_solucionar}
                  onChange={(e) => setFormData({ ...formData, como_solucionar: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>

              {/* UPLOAD DE IMAGENS / PRINTS DOS HELPS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    PRINTS DO HELP (Upload de Imagens)
                  </label>
                  <span className="text-[11px] text-blue-400 font-mono">
                    Dica: Use Ctrl+V para colar direto da área de transferência!
                  </span>
                </div>

                {/* Dropzone / Upload Trigger */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-950/60 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      Clique para escolher imagem ou cole com <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 text-[10px]">Ctrl+V</kbd>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Suporta PNG, JPG, Prints de tela e evidências
                    </p>
                  </div>
                </div>

                {/* Thumbnails of attached images */}
                {formData.imagens.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
                    {formData.imagens.map((img) => (
                      <div
                        key={img.id}
                        className="relative rounded-lg overflow-hidden border border-slate-800 group bg-slate-950 aspect-video"
                      >
                        <img
                          src={img.dataUrl}
                          alt="Print Anexado"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-md transition-colors shadow-sm"
                          title="Remover imagem"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  disabled={isSubmitting || isUploadingImage}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-all shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingHelp ? 'Salvar Alterações' : 'Cadastrar Help'}
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
                <h3 className="text-base font-bold text-white">Excluir Help</h3>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Deseja realmente remover o Help <strong className="text-white font-mono">{deleteCandidate.nome}</strong> da base de conhecimento?
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
