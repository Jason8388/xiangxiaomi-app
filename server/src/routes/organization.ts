import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取完整的组织结构（部门树 + 员工）
router.get('/', async (req, res) => {
  try {
    // 获取所有部门
    const deptResult = await pool.query(
      `SELECT * FROM departments WHERE is_disabled = false ORDER BY sort_order ASC, id ASC`
    );

    // 获取所有员工（带有部门信息）
    const userResult = await pool.query(
      `SELECT u.id, u.username, u.name, u.role, u.position, u.email, u.phone, u.department_id,
              d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.is_disabled = false AND u.role != 'admin'
       ORDER BY d.sort_order ASC, u.name ASC`
    );

    // 构建部门树，并添加员工
    const buildTree = (parentId: number | null = null) => {
      return deptResult.rows
        .filter(dept => dept.parent_id === parentId)
        .map(dept => {
          const employees = userResult.rows.filter(
            user => user.department_id === dept.id
          );
          return {
            ...dept,
            employees,
            children: buildTree(dept.id),
          };
        });
    };

    const tree = buildTree(null);

    // 获取未分配部门的员工
    const unassignedEmployees = userResult.rows.filter(
      user => !user.department_id
    );

    res.json({
      tree,
      unassignedEmployees,
      totalDepartments: deptResult.rows.length,
      totalEmployees: userResult.rows.length,
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: '获取组织结构失败' });
  }
});

// 获取部门下的员工列表
router.get('/:id/employees', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, u.name, u.role, u.position, u.email, u.phone,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.department_id = $1 AND u.is_disabled = false
       ORDER BY u.name ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get department employees error:', error);
    res.status(500).json({ error: '获取部门员工失败' });
  }
});

// 获取员工详情
router.get('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
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
      const deptResult = await pool.query(
        `WITH RECURSIVE dept_path AS (
          SELECT id, name, parent_id, 1 as level
          FROM departments WHERE id = $1
          UNION ALL
          SELECT d.id, d.name, d.parent_id, dp.level + 1
          FROM departments d
          JOIN dept_path dp ON d.id = dp.parent_id
        )
        SELECT name FROM dept_path ORDER BY level DESC`,
        [deptId]
      );
      return deptResult.rows.map(r => r.name);
    };

    const deptPath = await getDepartmentPath(result.rows[0].department_id);

    res.json({
      ...result.rows[0],
      department_path: deptPath,
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: '获取员工详情失败' });
  }
});

export default router;
