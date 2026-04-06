import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 带重试机制的数据库查询
async function queryWithRetry(sql: string, params: any[] = [], retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(sql, params);
    } catch (error: any) {
      console.error(`Query attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Query failed after retries');
}

// 获取完整的组织结构（部门树 + 员工）
router.get('/', async (req, res) => {
  try {
    // 获取所有部门
    const deptResult = await queryWithRetry(
      `SELECT * FROM departments WHERE is_disabled = false ORDER BY sort_order ASC, id ASC`
    );

    // 获取所有员工（带有部门信息）
    const userResult = await queryWithRetry(
      `SELECT u.id, u.username, u.name, u.role, u.position, u.email, u.phone, u.department_id,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.is_disabled = false AND u.role != 'admin'
       ORDER BY d.sort_order ASC, u.name ASC`
    );

    // 构建部门树，并添加员工
    interface OrgNode {
      id: number;
      name: string;
      parent_id: number | null;
      employeeCount: number;
      employees: any[];
      children: OrgNode[];
    }
    const buildTree = (parentId: number | null = null): OrgNode[] => {
      return deptResult.rows
        .filter((dept: any) => dept.parent_id === parentId)
        .map((dept: any) => {
          const employees = userResult.rows.filter(
            (user: any) => user.department_id === dept.id
          );
          return {
            ...dept,
            employeeCount: employees.length,
            employees,
            children: buildTree(dept.id),
          };
        });
    };

    const tree = buildTree(null);

    // 获取未分配部门的员工
    const unassignedEmployees = userResult.rows.filter(
      (user: any) => !user.department_id
    );

    res.json({
      tree,
      unassignedEmployees,
      totalDepartments: deptResult.rows.length,
      totalEmployees: userResult.rows.length,
    });
  } catch (error: any) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: '获取组织结构失败: ' + error.message });
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
