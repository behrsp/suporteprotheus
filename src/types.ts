export type ParameterType = 'Logico' | 'Caracter' | 'data' | 'numero';

export interface TableItem {
  id: number;
  alias: string;
  nome: string;
  modulo: string;
  descricao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParameterItem {
  id: number;
  nome: string;
  tipo: ParameterType;
  valor: string;
  finalidade: string;
  modulo: string;
  created_at?: string;
  updated_at?: string;
}

export interface HelpImage {
  id: string;
  name?: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface HelpItem {
  id: number;
  nome: string;
  descricao: string;
  como_solucionar: string;
  modulo: string;
  imagens: HelpImage[];
  created_at?: string;
  updated_at?: string;
}

export interface SystemStats {
  totalTables: number;
  totalParameters: number;
  totalHelps: number;
  isDbConnected: boolean;
}

export type ActiveTab = 'dashboard' | 'tables' | 'parameters' | 'helps';
