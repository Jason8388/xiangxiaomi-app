import express from 'express';
import pool from '../database/db';
import { memoryDepartments, memoryUsersList } from '../database/memory-storage';

const router = express.Router();

// 内存数据构建组织结构（优化版）
function buildMemoryOrganization() {
  // 预处理：按部门ID分组员工，避免每次遍历全量数据
  const employeesByDept = new Map<number | null, any[]>();
  memoryUsersList.forEach(user => {
    const deptId = user.department_id || null;
    if (!employeesByDept.has(deptId)) {
      employeesByDept.set(deptId, []);
    }
    employeesByDept.get(deptId)!.push(user);
  });

  const buildTree = (parentId: number | null = null): any[] => {
    return memoryDepartments
      .filter(dept => dept.parent_id === parentId)
      .map(dept => {
        const employees = employeesByDept.get(dept.id) || [];
        return {
          ...dept,
          employeeCount: employees.length,
          employees,
          children: buildTree(dept.id),
        };
      });
  };
  
  const tree = buildTree(null);
  const unassignedEmployees = employeesByDept.get(null) || [];
  
  return {
    tree,
    unassignedEmployees,
    totalDepartments: memoryDepartments.length,
    totalEmployees: memoryUsersList.length,
  };
}

// 带超时和重试的数据库查询
async function queryWithRetry(sql: string, params: any[] = [], retries = 1): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      // 使用 Promise.race 添加超时控制（3秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 3000);
      });
      const queryPromise = pool.query(sql, params);
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error: any) {
      console.error(`Query attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error('Query failed after retries');
}

// 获取完整的组织结构（部门树 + 员工）
router.get('/', async (req, res) => {
  try {
    // 直接使用内存数据构建组织结构（避免数据库连接超时）
    const memoryOrg = buildMemoryOrganization();
    res.json(memoryOrg);
  } catch (error: any) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: '获取组织结构失败' });
  }
});

// 获取部门下的员工列表
router.get('/:id/employees', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await queryWithRetry(
      `SELECT u.id, u.username, u.name, u.role, u.position, u.email, u.phone,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.department_id = $1 AND u.is_disabled = false
       ORDER BY u.name ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Get department employees error:', error);
    res.status(500).json({ error: '获取部门员工失败: ' + error.message });
  }
});

// 获取员工详情
router.get('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await queryWithRetry(
      `SELECT u.id, u.username, u.name, u.role, u.position, u.email, u.phone, u.department_id,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '员工不存在' });
    }

    // 获取该员工所属部门的层级路径
    const getDepartmentPath = async (deptId: number | null): Promise<string[]> => {
      if (!deptId) return [];
      
      const deptResult = await queryWithRetry(
        `SELECT id, name, parent_id FROM departments WHERE id = $1`,
        [deptId]
      );
      
      if (deptResult.rows.length === 0) return [];
      
      const dept = deptResult.rows[0];
      const parentPath = await getDepartmentPath(dept.parent_id);
      return [...parentPath, dept.name];
    };

    const employee = result.rows[0];
    const departmentPath = await getDepartmentPath(employee.department_id);

    res.json({
      ...employee,
      departmentPath,
    });
  } catch (error: any) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: '获取员工详情失败: ' + error.message });
  }
});

export default router;
