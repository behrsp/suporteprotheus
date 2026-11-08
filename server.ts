import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Increase payload limits for screenshot uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database configuration with Neon DB connection string
const rawDbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_APmiFr2nTq5h@ep-spring-union-b6qx2lkj-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require';
// Clean unsupported parameters like channel_binding for standard node-postgres
const sanitizedDbUrl = rawDbUrl.replace(/([?&])channel_binding=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');

const pool = new pg.Pool({
  connectionString: sanitizedDbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

let isDbConnected = false;

// Fallback in-memory stores in case DB is momentarily unavailable
let fallbackTables: any[] = [
  { id: 1, alias: 'SA1', nome: 'Clientes', modulo: 'FAT - Faturamento', descricao: 'Cadastro mestre de clientes e prospectos. Chave: A1_FILIAL + A1_COD + A1_LOJA.' },
  { id: 2, alias: 'SA2', nome: 'Fornecedores', modulo: 'COM - Compras', descricao: 'Cadastro de fornecedores e prestadores de serviço. Chave: A2_FILIAL + A2_COD + A2_LOJA.' },
  { id: 3, alias: 'SB1', nome: 'Descrição Genérica do Produto', modulo: 'EST - Estoque', descricao: 'Cadastro de produtos, matérias-primas e serviços. Chave: B1_FILIAL + B1_COD.' },
  { id: 4, alias: 'SC5', nome: 'Cabeçalho do Pedido de Venda', modulo: 'FAT - Faturamento', descricao: 'Pedidos de venda e orçamentos comerciais. Chave: C5_FILIAL + C5_NUM.' },
  { id: 5, alias: 'SC6', nome: 'Itens dos Pedidos de Venda', modulo: 'FAT - Faturamento', descricao: 'Itens vinculados aos pedidos de venda. Chave: C6_FILIAL + C6_NUM + C6_ITEM.' },
  { id: 6, alias: 'SE1', nome: 'Contas a Receber', modulo: 'FIN - Financeiro', descricao: 'Títulos a receber, duplicatas e adiantamentos de clientes. Chave: E1_FILIAL + E1_PREFIXO + E1_NUM + E1_PARCELA + E1_TIPO.' },
  { id: 7, alias: 'SE2', nome: 'Contas a Pagar', modulo: 'FIN - Financeiro', descricao: 'Títulos a pagar a fornecedores, impostos e despesas. Chave: E2_FILIAL + E2_PREFIXO + E2_NUM + E2_PARCELA + E2_TIPO.' },
  { id: 8, alias: 'SF1', nome: 'Cabeçalho das NF de Entrada', modulo: 'COM - Compras', descricao: 'Documentos fiscais de entrada (compras, devoluções). Chave: F1_FILIAL + F1_DOC + F1_SERIE + F1_FORNECE + F1_LOJA.' },
  { id: 9, alias: 'SF2', nome: 'Cabeçalho das NF de Saída', modulo: 'FAT - Faturamento', descricao: 'Documentos fiscais de saída (faturamento de vendas). Chave: F2_FILIAL + F2_DOC + F2_SERIE + F2_CLIENTE + F2_LOJA.' },
  { id: 10, alias: 'CT2', nome: 'Lançamentos Contábeis', modulo: 'CTB - Contabilidade', descricao: 'Partidas e lançamentos contábeis diários. Chave: CT2_FILIAL + CT2_DATA + CT2_LOTE + CT2_SBLOTE + CT2_DOC + CT2_LINHA.' },
  { id: 11, alias: 'SX6', nome: 'Parâmetros do Sistema', modulo: 'CFG - Configurador', descricao: 'Dicionário de dados com os parâmetros de configuração geral do Protheus.' },
  { id: 12, alias: 'SX3', nome: 'Campos do Dicionário', modulo: 'CFG - Configurador', descricao: 'Definição dos campos de todas as tabelas (tamanho, tipo, picture, validações).' }
];

let fallbackParameters: any[] = [
  { id: 1, nome: 'MV_ESTNEG', tipo: 'Logico', valor: 'N', finalidade: 'Determina se o Protheus permite movimentação de estoque com saldo negativo (.T. = Permite, .F. ou N = Bloqueia).', modulo: 'EST - Estoque' },
  { id: 2, nome: 'MV_ULMES', tipo: 'data', valor: '31/10/2026', finalidade: 'Data em que ocorreu o último fechamento de estoque mensal no módulo de Estoque/Custos.', modulo: 'EST - Estoque' },
  { id: 3, nome: 'MV_DOCSEAL', tipo: 'Caracter', valor: '2', finalidade: 'Indica a forma de controle de numeração para documentos fiscais eletrônicos NF-e/NFS-e.', modulo: 'FIS - Livros Fiscais' },
  { id: 4, nome: 'MV_DIASREC', tipo: 'numero', valor: '30', finalidade: 'Quantidade de dias padrão de tolerância para recebimento de títulos e controle de cobrança.', modulo: 'FIN - Financeiro' },
  { id: 5, nome: 'MV_BLOQCLI', tipo: 'Logico', valor: '.T.', finalidade: 'Habilita o bloqueio automático de pedidos de venda no faturamento para clientes com pendências financeiras.', modulo: 'FAT - Faturamento' },
  { id: 6, nome: 'MV_PAR01', tipo: 'Caracter', valor: 'FAT', finalidade: 'Parâmetro de filtro inicial padrão de relatórios e rotinas de faturamento.', modulo: 'FAT - Faturamento' },
  { id: 7, nome: 'MV_PRECISA', tipo: 'numero', valor: '4', finalidade: 'Número de casas decimais para cálculo de preços unitários nos pedidos de venda e cotações.', modulo: 'COM - Compras' },
  { id: 8, nome: 'MV_DATAFIN', tipo: 'data', valor: '31/12/2026', finalidade: 'Data limite para operações financeiras no exercício corrente.', modulo: 'FIN - Financeiro' }
];

let fallbackHelps: any[] = [
  {
    id: 1,
    nome: 'A410BLOQ',
    descricao: 'Help exibido na liberação ou gravação do Pedido de Venda (MATA410). Ocorre quando o cliente está com crédito bloqueado, títulos em atraso ou limite excedido.',
    como_solucionar: 'Passo a passo de resolução:\n1. Acesse SIGAFIN > Atualizações > Contas a Receber > Posição de Clientes (FINA010).\n2. Verifique se existem títulos vencidos na tabela SE1 ou se o saldo devedor atingiu o campo A1_LC.\n3. Se o cliente realizou o pagamento, confirme a baixa do título ou libere pontualmente em SIGAFAT > Atualizações > Pedidos > Liberação de Regras/Crédito (MATA450A).\n4. Para alteração definitiva de limite, acerte o cadastro no campo A1_LC (MATA030).',
    modulo: 'FAT - Faturamento',
    imagens: []
  },
  {
    id: 2,
    nome: 'REGNOTFOUND',
    descricao: 'Registro não encontrado no banco de dados. Ocorre com frequência quando uma chave estrangeira tenta consultar um registro que foi excluído ou não foi importado.',
    como_solucionar: 'Passo a passo de resolução:\n1. Identifique no rodapé do Help a tabela e chave procurada (Ex: SB1 filial + código).\n2. Acesse o APSDU ou a rotina de cadastro correspondente e confirme se o registro existe na empresa/filial conectada.\n3. Verifique se o compartilhamento da tabela (modo Exclusivo x Compartilhado no SX2) está compatível com as tabelas relacionadas.\n4. Caso o registro exista, execute a reindexação de índices no SIGACFG > Base de Dados > Dicionário > Tabelas.',
    modulo: 'EST - Estoque',
    imagens: []
  },
  {
    id: 3,
    nome: 'NOINTERV',
    descricao: 'Operação sem intervenção do usuário solicitada durante a execução de rotinas em Job, Schedule ou WebService.',
    como_solucionar: 'Passo a passo de resolução:\n1. Localize no código AdvPL/TLPP chamadas a rotinas de diálogo de tela como Alert(), MsgStop(), MsgYesNo(), ou FWMsgRun() sem verificação prévia.\n2. Utilize a função IsBlind() para certificar-se de que o ambiente é interativo antes de disparar janelas de tela.\n3. Redirecione mensagens informativas para o console do AppServer utilizando ConOut() ou FWLogMsg().',
    modulo: 'CFG - Configurador',
    imagens: []
  }
];

// Initialize database tables if connected
async function initDb() {
  try {
    const client = await pool.connect();
    isDbConnected = true;
    console.log('✅ Conectado com sucesso ao Neon PostgreSQL!');

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS protheus_tables (
        id SERIAL PRIMARY KEY,
        alias VARCHAR(20) NOT NULL UNIQUE,
        nome VARCHAR(255) NOT NULL,
        modulo VARCHAR(100),
        descricao TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS protheus_parameters (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        tipo VARCHAR(50) NOT NULL,
        valor TEXT NOT NULL,
        finalidade TEXT NOT NULL,
        modulo VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS protheus_helps (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT NOT NULL,
        como_solucionar TEXT NOT NULL,
        modulo VARCHAR(100),
        imagens JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Seed tables if empty
    const { rows: tableRows } = await client.query('SELECT COUNT(*) FROM protheus_tables');
    if (parseInt(tableRows[0].count, 10) === 0) {
      console.log('Populando dados iniciais de Tabelas do Protheus...');
      for (const t of fallbackTables) {
        await client.query(
          'INSERT INTO protheus_tables (alias, nome, modulo, descricao) VALUES ($1, $2, $3, $4) ON CONFLICT (alias) DO NOTHING',
          [t.alias, t.nome, t.modulo, t.descricao]
        );
      }
    }

    const { rows: paramRows } = await client.query('SELECT COUNT(*) FROM protheus_parameters');
    if (parseInt(paramRows[0].count, 10) === 0) {
      console.log('Populando dados iniciais de Parâmetros do Protheus...');
      for (const p of fallbackParameters) {
        await client.query(
          'INSERT INTO protheus_parameters (nome, tipo, valor, finalidade, modulo) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (nome) DO NOTHING',
          [p.nome, p.tipo, p.valor, p.finalidade, p.modulo]
        );
      }
    }

    const { rows: helpRows } = await client.query('SELECT COUNT(*) FROM protheus_helps');
    if (parseInt(helpRows[0].count, 10) === 0) {
      console.log('Populando dados iniciais de HELPs do Protheus...');
      for (const h of fallbackHelps) {
        await client.query(
          'INSERT INTO protheus_helps (nome, descricao, como_solucionar, modulo, imagens) VALUES ($1, $2, $3, $4, $5)',
          [h.nome, h.descricao, h.como_solucionar, h.modulo, JSON.stringify(h.imagens || [])]
        );
      }
    }

    client.release();
  } catch (err: any) {
    console.warn('⚠️ Aviso ao conectar ao Neon DB:', err.message);
    console.warn('Operando com armazenamento local ativo.');
    isDbConnected = false;
  }
}

initDb();

// ---------------- API ROUTES ----------------

// System Health & Connection Info
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    database: isDbConnected ? 'Neon PostgreSQL (Conectado)' : 'Cache Local Ativo',
    timestamp: new Date().toISOString(),
  });
});

// Overview Stats
app.get('/api/stats', async (req, res) => {
  try {
    if (isDbConnected) {
      const [tRes, pRes, hRes] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM protheus_tables'),
        pool.query('SELECT COUNT(*) FROM protheus_parameters'),
        pool.query('SELECT COUNT(*) FROM protheus_helps'),
      ]);
      return res.json({
        totalTables: parseInt(tRes.rows[0].count, 10),
        totalParameters: parseInt(pRes.rows[0].count, 10),
        totalHelps: parseInt(hRes.rows[0].count, 10),
        isDbConnected: true,
      });
    }
  } catch (err) {
    console.error(err);
  }
  res.json({
    totalTables: fallbackTables.length,
    totalParameters: fallbackParameters.length,
    totalHelps: fallbackHelps.length,
    isDbConnected: false,
  });
});

// 1. TABELAS (protheus_tables)
app.get('/api/tables', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query('SELECT * FROM protheus_tables ORDER BY alias ASC');
      return res.json(rows);
    }
  } catch (err) {
    console.error('Error fetching tables from DB:', err);
  }
  res.json(fallbackTables);
});

app.post('/api/tables', async (req, res) => {
  const { alias, nome, modulo, descricao } = req.body;
  if (!alias || !nome) {
    return res.status(400).json({ error: 'ALIAS e NOME são obrigatórios.' });
  }

  const cleanAlias = String(alias).trim().toUpperCase();
  const cleanNome = String(nome).trim();
  const cleanModulo = modulo ? String(modulo).trim() : 'Geral';
  const cleanDesc = descricao ? String(descricao).trim() : '';

  try {
    if (isDbConnected) {
      const { rows } = await pool.query(
        `INSERT INTO protheus_tables (alias, nome, modulo, descricao, updated_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING *`,
        [cleanAlias, cleanNome, cleanModulo, cleanDesc]
      );
      return res.status(201).json(rows[0]);
    }
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `A tabela com alias ${cleanAlias} já está cadastrada.` });
    }
    console.error(err);
  }

  // Fallback
  const existing = fallbackTables.find((t) => t.alias.toUpperCase() === cleanAlias);
  if (existing) {
    return res.status(409).json({ error: `A tabela com alias ${cleanAlias} já está cadastrada.` });
  }
  const newTable = {
    id: Date.now(),
    alias: cleanAlias,
    nome: cleanNome,
    modulo: cleanModulo,
    descricao: cleanDesc,
  };
  fallbackTables.push(newTable);
  res.status(201).json(newTable);
});

app.put('/api/tables/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { alias, nome, modulo, descricao } = req.body;

  if (!alias || !nome) {
    return res.status(400).json({ error: 'ALIAS e NOME são obrigatórios.' });
  }

  const cleanAlias = String(alias).trim().toUpperCase();
  const cleanNome = String(nome).trim();
  const cleanModulo = modulo ? String(modulo).trim() : 'Geral';
  const cleanDesc = descricao ? String(descricao).trim() : '';

  try {
    if (isDbConnected) {
      const { rows } = await pool.query(
        `UPDATE protheus_tables 
         SET alias = $1, nome = $2, modulo = $3, descricao = $4, updated_at = NOW() 
         WHERE id = $5 
         RETURNING *`,
        [cleanAlias, cleanNome, cleanModulo, cleanDesc, id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Tabela não encontrada.' });
      }
      return res.json(rows[0]);
    }
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `O alias ${cleanAlias} já está sendo usado em outra tabela.` });
    }
    console.error(err);
  }

  const index = fallbackTables.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tabela não encontrada.' });
  }
  fallbackTables[index] = { ...fallbackTables[index], alias: cleanAlias, nome: cleanNome, modulo: cleanModulo, descricao: cleanDesc };
  res.json(fallbackTables[index]);
});

app.delete('/api/tables/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    if (isDbConnected) {
      const { rowCount } = await pool.query('DELETE FROM protheus_tables WHERE id = $1', [id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Tabela não encontrada.' });
      }
      return res.json({ success: true, message: 'Tabela excluída com sucesso.' });
    }
  } catch (err) {
    console.error(err);
  }

  const index = fallbackTables.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tabela não encontrada.' });
  }
  fallbackTables.splice(index, 1);
  res.json({ success: true, message: 'Tabela excluída com sucesso.' });
});

// 2. PARÂMETROS (protheus_parameters)
app.get('/api/parameters', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query('SELECT * FROM protheus_parameters ORDER BY nome ASC');
      return res.json(rows);
    }
  } catch (err) {
    console.error('Error fetching parameters from DB:', err);
  }
  res.json(fallbackParameters);
});

app.post('/api/parameters', async (req, res) => {
  const { nome, tipo, valor, finalidade, modulo } = req.body;
  if (!nome || !tipo || valor === undefined || !finalidade) {
    return res.status(400).json({ error: 'NOME, TIPO, VALOR e FINALIDADE são obrigatórios.' });
  }

  const cleanNome = String(nome).trim().toUpperCase();
  const cleanTipo = String(tipo).trim();
  const cleanValor = String(valor).trim();
  const cleanFinalidade = String(finalidade).trim();
  const cleanModulo = modulo ? String(modulo).trim() : 'Geral';

  try {
    if (isDbConnected) {
      const { rows } = await pool.query(
        `INSERT INTO protheus_parameters (nome, tipo, valor, finalidade, modulo, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         RETURNING *`,
        [cleanNome, cleanTipo, cleanValor, cleanFinalidade, cleanModulo]
      );
      return res.status(201).json(rows[0]);
    }
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `O parâmetro ${cleanNome} já está cadastrado.` });
    }
    console.error(err);
  }

  const existing = fallbackParameters.find((p) => p.nome.toUpperCase() === cleanNome);
  if (existing) {
    return res.status(409).json({ error: `O parâmetro ${cleanNome} já está cadastrado.` });
  }

  const newParam = {
    id: Date.now(),
    nome: cleanNome,
    tipo: cleanTipo,
    valor: cleanValor,
    finalidade: cleanFinalidade,
    modulo: cleanModulo,
  };
  fallbackParameters.push(newParam);
  res.status(201).json(newParam);
});

app.put('/api/parameters/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nome, tipo, valor, finalidade, modulo } = req.body;

  if (!nome || !tipo || valor === undefined || !finalidade) {
    return res.status(400).json({ error: 'NOME, TIPO, VALOR e FINALIDADE são obrigatórios.' });
  }

  const cleanNome = String(nome).trim().toUpperCase();
  const cleanTipo = String(tipo).trim();
  const cleanValor = String(valor).trim();
  const cleanFinalidade = String(finalidade).trim();
  const cleanModulo = modulo ? String(modulo).trim() : 'Geral';

  try {
    if (isDbConnected) {
      const { rows } = await pool.query(
        `UPDATE protheus_parameters 
         SET nome = $1, tipo = $2, valor = $3, finalidade = $4, modulo = $5, updated_at = NOW() 
         WHERE id = $6 
         RETURNING *`,
        [cleanNome, cleanTipo, cleanValor, cleanFinalidade, cleanModulo, id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Parâmetro não encontrado.' });
      }
      return res.json(rows[0]);
    }
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `O nome ${cleanNome} já está em uso por outro parâmetro.` });
    }
    console.error(err);
  }

  const index = fallbackParameters.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Parâmetro não encontrado.' });
  }
  fallbackParameters[index] = {
    ...fallbackParameters[index],
    nome: cleanNome,
    tipo: cleanTipo,
    valor: cleanValor,
    finalidade: cleanFinalidade,
    modulo: cleanModulo,
  };
  res.json(fallbackParameters[index]);
});

app.delete('/api/parameters/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    if (isDbConnected) {
      const { rowCount } = await pool.query('DELETE FROM protheus_parameters WHERE id = $1', [id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Parâmetro não encontrado.' });
      }
      return res.json({ success: true, message: 'Parâmetro excluído com sucesso.' });
    }
  } catch (err) {
    console.error(err);
  }

  const index = fallbackParameters.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Parâmetro não encontrado.' });
  }
  fallbackParameters.splice(index, 1);
  res.json({ success: true, message: 'Parâmetro excluído com sucesso.' });
});

// 3. BASE DE CONHECIMENTO / HELPS (protheus_helps)
app.get('/api/helps', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query('SELECT * FROM protheus_helps ORDER BY id DESC');
      return res.json(rows);
    }
  } catch (err) {
    console.error('Error fetching helps from DB:', err);
  }
  res.json(fallbackHelps);
});

app.post('/api/helps', async (req, res) => {
  const { nome, descricao, como_solucionar, modulo, imagens } = req.body;
  if (!nome || !descricao || !como_solucionar) {
    return res.status(400).json({ error: 'NOME, DESCRIÇÃO e COMO SOLUCIONAR são obrigatórios.' });
  }

  const cleanNome = String(nome).trim().toUpperCase();
  const cleanDescricao = String(descricao).trim();
  const cleanSolucao = String(como_solucionar).trim();
  const cleanModulo = modulo ? String(modulo).trim() : 'Geral';
  const cleanImagens = Array.isArray(imagens) ? imagens : [];

  try {
    if (isDbConnected) {
      const { rows } = await pool.query(
        `INSERT INTO protheus_helps (nome, descricao, como_solucionar, modulo, imagens, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         RETURNING *`,
        [cleanNome, cleanDescricao, cleanSolucao, cleanModulo, JSON.stringify(cleanImagens)]
      );
      return res.status(201).json(rows[0]);
    }
  } catch (err) {
    console.error(err);
  }

  const newHelp = {
    id: Date.now(),
    nome: cleanNome,
    descricao: cleanDescricao,
    como_solucionar: cleanSolucao,
    modulo: cleanModulo,
    imagens: cleanImagens,
  };
  fallbackHelps.unshift(newHelp);
  res.status(201).json(newHelp);
});

app.put('/api/helps/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nome, descricao, como_solucionar, modulo, imagens } = req.body;

  if (!nome || !descricao || !como_solucionar) {
    return res.status(400).json({ error: 'NOME, DESCRIÇÃO e COMO SOLUCIONAR são obrigatórios.' });
  }

  const cleanNome = String(nome).trim().toUpperCase();
  const cleanDescricao = String(descricao).trim();
  const cleanSolucao = String(como_solucionar).trim();
  const cleanModulo = modulo ? String(modulo).trim() : 'Geral';
  const cleanImagens = Array.isArray(imagens) ? imagens : [];

  try {
    if (isDbConnected) {
      const { rows } = await pool.query(
        `UPDATE protheus_helps 
         SET nome = $1, descricao = $2, como_solucionar = $3, modulo = $4, imagens = $5, updated_at = NOW() 
         WHERE id = $6 
         RETURNING *`,
        [cleanNome, cleanDescricao, cleanSolucao, cleanModulo, JSON.stringify(cleanImagens), id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Help não encontrado.' });
      }
      return res.json(rows[0]);
    }
  } catch (err) {
    console.error(err);
  }

  const index = fallbackHelps.findIndex((h) => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Help não encontrado.' });
  }
  fallbackHelps[index] = {
    ...fallbackHelps[index],
    nome: cleanNome,
    descricao: cleanDescricao,
    como_solucionar: cleanSolucao,
    modulo: cleanModulo,
    imagens: cleanImagens,
  };
  res.json(fallbackHelps[index]);
});

app.delete('/api/helps/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    if (isDbConnected) {
      const { rowCount } = await pool.query('DELETE FROM protheus_helps WHERE id = $1', [id]);
      if (rowCount === 0) {
        return res.status(404).json({ error: 'Help não encontrado.' });
      }
      return res.json({ success: true, message: 'Help excluído com sucesso.' });
    }
  } catch (err) {
    console.error(err);
  }

  const index = fallbackHelps.findIndex((h) => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Help não encontrado.' });
  }
  fallbackHelps.splice(index, 1);
  res.json({ success: true, message: 'Help excluído com sucesso.' });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 SUPORTE PROTHEUS rodando em http://localhost:${port}`);
  });
}

startServer();
