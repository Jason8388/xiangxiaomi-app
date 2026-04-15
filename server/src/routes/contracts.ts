import express from 'express';
import pool, { USE_DATABASE } from '../database/db';
import { memoryContracts as preloadedContracts } from '../database/memory-storage';

const router = express.Router();

// 内存数据存储 - 使用预置数据
const memoryContracts: any[] = [...preloadedContracts];
let memoryContractId = preloadedContracts.length > 0 ? Math.max(...preloadedContracts.map(c => c.id)) + 1 : 1;

// 带重试的查询函数
async function queryWithRetry(query: string, params: any[] = [], retries = 1, delay = 500) {
  if (!USE_DATABASE) {
    throw new Error('Database not available');
  }
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(query, params);
    } catch (error: any) {
      if (i < retries - 1 && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.message.includes('terminated'))) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

// 获取合同列表
router.get('/', async (req, res) => {
  try {
    const result = await queryWithRetry(
      'SELECT c.*, cu.name as customer_name FROM contracts c LEFT JOIN customers cu ON c.customer_id = cu.id ORDER BY c.id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get contracts error, using memory storage:', error);
    res.json(memoryContracts);
  }
});

// 获取合同详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 从内存存储获取
    const contract = memoryContracts.find((c) => c.id === parseInt(id as string));
    if (!contract) {
      return res.status(404).json({ error: '合同不存在' });
    }

    // 格式化字段以匹配前端期望
    const formattedContract = {
      id: contract.id,
      contract_number: contract.contract_no,
      contract_name: contract.title,
      customer_name: contract.customer_name,
      business_manager: contract.business_manager || '',
      sign_date: contract.sign_date || '',
      acceptance_date: contract.acceptance_date || '',
      warranty_end_date: contract.warranty_end_date || '',
      contract_amount: contract.amount || 0,
      remarks: contract.remarks || '',
      tags: contract.tags || [],
      addresses: contract.addresses || [],
      contacts: contract.contacts || [],
      device_count: contract.device_count || 0,
      work_order_count: contract.work_order_count || 0,
    };

    res.json(formattedContract);
  } catch (error) {
    console.error('Get contract detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建合同
router.post('/', async (req, res) => {
  try {
    const { customer_id, customer_name, contract_no, title, sign_date, acceptance_date, warranty_end_date, amount, status, content } = req.body;

    if (!customer_id || !contract_no) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    try {
      const result = await queryWithRetry(
        'INSERT INTO contracts (customer_id, contract_no, title, sign_date, acceptance_date, warranty_end_date, amount, status, content) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [customer_id, contract_no, title || contract_no, sign_date, acceptance_date, warranty_end_date, amount, status || 'active', content]
      );
      res.json(result.rows[0]);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const newContract = {
        id: memoryContractId++,
        customer_id,
        customer_name,
        contract_no,
        title: title || contract_no,
        sign_date,
        acceptance_date,
        warranty_end_date,
        amount,
        status: status || 'active',
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryContracts.push(newContract);
      res.json(newContract);
    }
  } catch (error: any) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新合同
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contract_number,
      contract_name,
      customer_name,
      business_manager,
      sign_date,
      acceptance_date,
      warranty_end_date,
      contract_amount,
      remarks,
      tags,
    } = req.body;

    // 从内存存储获取
    const contractIndex = memoryContracts.findIndex((c) => c.id === parseInt(id as string));
    if (contractIndex === -1) {
      return res.status(404).json({ error: '合同不存在' });
    }

    const contract = memoryContracts[contractIndex];

    // 更新字段
    if (contract_number !== undefined) contract.contract_no = contract_number;
    if (contract_name !== undefined) contract.title = contract_name;
    if (customer_name !== undefined) contract.customer_name = customer_name;
    if (business_manager !== undefined) contract.business_manager = business_manager;
    if (sign_date !== undefined) contract.sign_date = sign_date;
    if (acceptance_date !== undefined) contract.acceptance_date = acceptance_date;
    if (warranty_end_date !== undefined) contract.warranty_end_date = warranty_end_date;
    if (contract_amount !== undefined) contract.amount = contract_amount;
    if (remarks !== undefined) contract.remarks = remarks;
    if (tags !== undefined) contract.tags = tags;
    contract.updated_at = new Date().toISOString();

    res.json(contract);
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除合同
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contracts WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
