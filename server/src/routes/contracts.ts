import express from 'express';
import pool, { USE_DATABASE } from '../database/db';
import { memoryContracts as preloadedContracts } from '../database/memory-storage';
import ExcelJS from 'exceljs';

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

// 导出合同为 Excel
router.get('/export/excel', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '项小秘';
    workbook.created = new Date();

    // 创建工作表
    const worksheet = workbook.addWorksheet('合同列表', {
      properties: { tabColor: { argb: 'FF4F46E5' } }
    });

    // 定义列 - 包含所有合同信息项（18个字段）
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: '合同编号', key: 'contract_number', width: 18 },
      { header: '合同名称', key: 'contract_name', width: 25 },
      { header: '客户名称', key: 'customer_name', width: 20 },
      { header: '商务经理', key: 'business_manager', width: 15 },
      { header: '合同金额', key: 'contract_amount', width: 12 },
      { header: '签约日期', key: 'sign_date', width: 15 },
      { header: '验收日期', key: 'acceptance_date', width: 15 },
      { header: '质保到期日期', key: 'warranty_end_date', width: 15 },
      { header: '状态', key: 'status', width: 10 },
      { header: '标签', key: 'tags', width: 20 },
      { header: '设备数量', key: 'device_count', width: 10 },
      { header: '工单数量', key: 'work_order_count', width: 10 },
      { header: '备注', key: 'remarks', width: 30 },
      { header: '创建时间', key: 'created_at', width: 20 },
      { header: '更新时间', key: 'updated_at', width: 20 },
      { header: '联系人', key: 'contacts', width: 30 },
      { header: '地址', key: 'addresses', width: 30 }
    ];

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 状态映射
    const statusMap: Record<string, string> = {
      active: '生效',
      expired: '已过期',
      cancelled: '已取消'
    };

    // 添加数据行
    memoryContracts.forEach((contract) => {
      worksheet.addRow({
        id: contract.id,
        contract_number: contract.contract_number || '',
        contract_name: contract.contract_name || '',
        customer_name: contract.customer_name || '',
        business_manager: contract.business_manager || '',
        contract_amount: contract.contract_amount || 0,
        sign_date: contract.sign_date || '',
        acceptance_date: contract.acceptance_date || '',
        warranty_end_date: contract.warranty_end_date || '',
        status: statusMap[contract.status] || contract.status,
        tags: Array.isArray(contract.tags) ? contract.tags.join(', ') : '',
        device_count: contract.device_count || 0,
        work_order_count: contract.work_order_count || 0,
        remarks: contract.remarks || '',
        created_at: contract.created_at || '',
        updated_at: contract.updated_at || '',
        contacts: Array.isArray(contract.contacts) ? contract.contacts.map((c: any) => `${c.name}:${c.phone}`).join('; ') : '',
        addresses: Array.isArray(contract.addresses) ? contract.addresses.join('; ') : ''
      });
    });

    // 设置边框
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer();

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('合同列表')}.xlsx`);

    res.send(buffer);
  } catch (error) {
    console.error('Export contracts error:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

// 下载合同导入模板
router.get('/template', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '项小秘';
    workbook.created = new Date();

    // 创建工作表
    const worksheet = workbook.addWorksheet('合同导入模板', {
      properties: { tabColor: { argb: 'FF4F46E5' } }
    });

    // 定义列 - 包含所有可导入字段
    worksheet.columns = [
      { header: '合同编号*', key: 'contract_number', width: 18 },
      { header: '合同名称*', key: 'contract_name', width: 25 },
      { header: '客户名称*', key: 'customer_name', width: 20 },
      { header: '商务经理', key: 'business_manager', width: 15 },
      { header: '合同金额', key: 'contract_amount', width: 12 },
      { header: '签约日期', key: 'sign_date', width: 15 },
      { header: '验收日期', key: 'acceptance_date', width: 15 },
      { header: '质保到期日期', key: 'warranty_end_date', width: 15 },
      { header: '状态', key: 'status', width: 10 },
      { header: '标签', key: 'tags', width: 20 },
      { header: '备注', key: 'remarks', width: 30 }
    ];

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 添加示例数据
    worksheet.addRow({
      contract_number: 'CON2024001',
      contract_name: '设备维护服务合同',
      customer_name: '示例客户',
      business_manager: '张三',
      contract_amount: '50000',
      sign_date: '2024-01-01',
      acceptance_date: '2024-01-15',
      warranty_end_date: '2025-01-01',
      status: '生效',
      tags: '年度合同,重要客户',
      remarks: '示例备注'
    });

    // 添加说明行
    worksheet.addRow({});
    worksheet.addRow({ contract_number: '说明：带*号的字段为必填项', contract_name: '', customer_name: '' });
    worksheet.addRow({ contract_number: '状态可选值：生效、已过期、已取消', contract_name: '', customer_name: '' });
    worksheet.addRow({ contract_number: '日期格式：YYYY-MM-DD，如：2024-01-01', contract_name: '', customer_name: '' });
    worksheet.addRow({ contract_number: '金额格式：数字，如：50000', contract_name: '', customer_name: '' });
    worksheet.addRow({ contract_number: '标签格式：多个标签用逗号分隔，如：年度合同,重要客户', contract_name: '', customer_name: '' });

    // 设置边框
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer();

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('合同导入模板')}.xlsx`);

    res.send(buffer);
  } catch (error) {
    console.error('Download contract template error:', error);
    res.status(500).json({ error: '下载模板失败' });
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

    res.json(contract);
  } catch (error) {
    console.error('Get contract detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建合同
router.post('/', async (req, res) => {
  try {
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

    if (!contract_number || !contract_name || !customer_name) {
      return res.status(400).json({ error: '缺少必填字段：合同编号、合同名称、客户名称' });
    }

    // 使用内存存储创建合同
    const newContract = {
      id: memoryContractId++,
      contract_number: contract_number,
      contract_name: contract_name,
      customer_name: customer_name,
      business_manager: business_manager || '',
      contract_amount: contract_amount ? parseFloat(contract_amount) : 0,
      sign_date: sign_date || '',
      acceptance_date: acceptance_date || '',
      warranty_end_date: warranty_end_date || '',
      status: 'active',
      remarks: remarks || '',
      tags: tags || [],
      addresses: [],
      contacts: [],
      device_count: 0,
      work_order_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryContracts.unshift(newContract);

    res.status(201).json(newContract);
  } catch (error) {
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
    if (contract_number !== undefined) contract.contract_number = contract_number;
    if (contract_name !== undefined) contract.contract_name = contract_name;
    if (customer_name !== undefined) contract.customer_name = customer_name;
    if (business_manager !== undefined) contract.business_manager = business_manager;
    if (sign_date !== undefined) contract.sign_date = sign_date;
    if (acceptance_date !== undefined) contract.acceptance_date = acceptance_date;
    if (warranty_end_date !== undefined) contract.warranty_end_date = warranty_end_date;
    if (contract_amount !== undefined) contract.contract_amount = contract_amount;
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
    const contractId = parseInt(id as string);

    // 从内存存储删除
    const contractIndex = memoryContracts.findIndex((c) => c.id === contractId);
    if (contractIndex === -1) {
      return res.status(404).json({ error: '合同不存在' });
    }

    memoryContracts.splice(contractIndex, 1);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 批量导入合同
router.post('/import', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const buffer = Buffer.from(req.file!.buffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: 'Excel文件为空' });
    }

    const importedContracts: any[] = [];
    const errors: any[] = [];

    // 从第2行开始读取（第1行是表头）
    let rowCount = 0;
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const rowValues = row.values as (string | number | undefined)[];

      // 跳过空行
      if (rowValues.length === 0 || (rowValues[1] === undefined && rowValues[2] === undefined)) {
        continue;
      }

      rowCount++;

      const contract_number = row.getCell(1).value?.toString().trim();
      const contract_name = row.getCell(2).value?.toString().trim();
      const customer_name = row.getCell(3).value?.toString().trim();
      const business_manager = row.getCell(4).value?.toString().trim() || '';
      const contract_amount = row.getCell(5).value ? parseFloat(row.getCell(5).value.toString()) : 0;
      const sign_date = row.getCell(6).value?.toString().trim() || '';
      const acceptance_date = row.getCell(7).value?.toString().trim() || '';
      const warranty_end_date = row.getCell(8).value?.toString().trim() || '';
      const status_text = row.getCell(9).value?.toString().trim() || '生效';
      const tags_text = row.getCell(10).value?.toString().trim() || '';
      const remarks = row.getCell(11).value?.toString().trim() || '';

      // 验证必填项
      if (!contract_number || !contract_name || !customer_name) {
        errors.push({
          row: i,
          error: '缺少必填字段：合同编号、合同名称、客户名称'
        });
        continue;
      }

      // 状态映射
      const statusMap: Record<string, string> = {
        '生效': 'active',
        '已过期': 'expired',
        '已取消': 'cancelled'
      };
      const status = statusMap[status_text] || status_text;

      // 解析标签
      const tags = tags_text ? tags_text.split(',').map((tag: string) => tag.trim()) : [];

      // 创建合同
      const newContract = {
        id: memoryContractId++,
        contract_number,
        contract_name,
        customer_name,
        business_manager,
        contract_amount,
        sign_date,
        acceptance_date,
        warranty_end_date,
        status,
        tags,
        remarks,
        addresses: [],
        contacts: [],
        device_count: 0,
        work_order_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      importedContracts.push(newContract);
    }

    // 将导入的合同添加到内存存储
    importedContracts.forEach((contract) => {
      memoryContracts.unshift(contract);
    });

    res.json({
      message: '导入完成',
      total: rowCount,
      success: importedContracts.length,
      failed: errors.length,
      errors,
      data: importedContracts
    });
  } catch (error) {
    console.error('Import contracts error:', error);
    res.status(500).json({ error: '导入失败' });
  }
});

// 导出内存存储供其他路由使用
export { memoryContracts };

export default router;
