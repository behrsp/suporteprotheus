import { TableItem, ParameterItem, HelpItem, SystemStats } from '../types';

export const api = {
  // Stats & Health
  async getStats(): Promise<SystemStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Falha ao obter estatísticas');
    return res.json();
  },

  async getHealth(): Promise<{ status: string; database: string }> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Falha ao verificar status do servidor');
    return res.json();
  },

  // Tabelas
  async getTables(): Promise<TableItem[]> {
    const res = await fetch('/api/tables');
    if (!res.ok) throw new Error('Falha ao carregar tabelas');
    return res.json();
  },

  async createTable(data: Omit<TableItem, 'id' | 'created_at' | 'updated_at'>): Promise<TableItem> {
    const res = await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao cadastrar tabela');
    }
    return res.json();
  },

  async updateTable(id: number, data: Partial<TableItem>): Promise<TableItem> {
    const res = await fetch(`/api/tables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar tabela');
    }
    return res.json();
  },

  async deleteTable(id: number): Promise<void> {
    const res = await fetch(`/api/tables/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir tabela');
    }
  },

  // Parâmetros
  async getParameters(): Promise<ParameterItem[]> {
    const res = await fetch('/api/parameters');
    if (!res.ok) throw new Error('Falha ao carregar parâmetros');
    return res.json();
  },

  async createParameter(data: Omit<ParameterItem, 'id' | 'created_at' | 'updated_at'>): Promise<ParameterItem> {
    const res = await fetch('/api/parameters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao cadastrar parâmetro');
    }
    return res.json();
  },

  async updateParameter(id: number, data: Partial<ParameterItem>): Promise<ParameterItem> {
    const res = await fetch(`/api/parameters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar parâmetro');
    }
    return res.json();
  },

  async deleteParameter(id: number): Promise<void> {
    const res = await fetch(`/api/parameters/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir parâmetro');
    }
  },

  // HELPs
  async getHelps(): Promise<HelpItem[]> {
    const res = await fetch('/api/helps');
    if (!res.ok) throw new Error('Falha ao carregar base de helps');
    return res.json();
  },

  async createHelp(data: Omit<HelpItem, 'id' | 'created_at' | 'updated_at'>): Promise<HelpItem> {
    const res = await fetch('/api/helps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao cadastrar help');
    }
    return res.json();
  },

  async updateHelp(id: number, data: Partial<HelpItem>): Promise<HelpItem> {
    const res = await fetch(`/api/helps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar help');
    }
    return res.json();
  },

  async deleteHelp(id: number): Promise<void> {
    const res = await fetch(`/api/helps/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir help');
    }
  },
};
