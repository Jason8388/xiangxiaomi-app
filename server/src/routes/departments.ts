import express from 'express';
import pool from '../database/db';

const router = express.Router();

// 获取部门列表（树形结构）
router.get('/', async (req, res) => {
  try {
    const { include_disabled = 'false' } = req.query;
    const includeDisabled = include_disabled === 'true';

    // 获取所有部门
    let result;
    if (includeDisabled) {
      result = await pool.query(
        `SELECT * FROM departments ORDER BY sort_order ASC, id ASC`
      );
    } else {
      result = await pool.query(
        `SELECT * FROM departments WHERE is_disabled = false ORDER BY sort_order ASC, id ASC`
      );
    }

    // 构建树形结构
    interface DeptNode {
      id: number;
      name: string;
      parent_id: number | null;
      children: DeptNode[];
    }
    const buildTree = (parentId: number | null = null): DeptNode[] => {
      return result.rows
        .filter(dept => dept.parent_id === parentId)
        .map(dept => ({
          ...dept,
          children: buildTree(dept.id),
        }));
    };

    const tree = buildTree(null);

    res.json(tree);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: '获取部门列表失败' });
  }
});

// 获取部门详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '部门不存在' });
    }

    // 获取子部门
    const childrenResult = await pool.query(
      'SELECT * FROM departments WHERE parent_id = $1 ORDER BY sort_order ASC, id ASC',
      [id]
    );

    const department = {
      ...result.rows[0],
      children: childrenResult.rows,
    };

    res.json(department);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: '获取部门详情失败' });
  }
});

// 创建部门
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, code, description, parent_id, sort_order = 0 } = req.body;

    // 参数验证
    if (!name || !code) {
      return res.status(400).json({ error: '部门名称和代码不能为空' });
    }

    // 检查代码是否重复
    const codeCheck = await client.query(
      'SELECT id FROM departments WHERE code = $1',
      [code]
    );
    if (codeCheck.rows.length > 0) {
      return res.status(400).json({ error: '部门代码已存在' });
    }

    // 如果有父部门，检查父部门是否存在
    if (parent_id) {
      const parentCheck = await client.query(
        'SELECT id FROM departments WHERE id = $1',
        [parent_id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: '父部门不存在' });
      }
    }

    // 创建部门
    const result = await client.query(
      `INSERT INTO departments (name, code, description, parent_id, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, code, description, parent_id, sort_order]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: '创建部门失败' });
  } finally {
    client.release();
  }
});

// 更新部门
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, code, description, parent_id, sort_order, is_disabled } = req.body;

    // 检查部门是否存在
    const checkResult = await client.query(
      'SELECT id FROM departments WHERE id = $1',
      [id]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '部门不存在' });
    }

    // 检查代码是否重复（排除自己）
    if (code) {
      const codeCheck = await client.query(
        'SELECT id FROM departments WHERE code = $1 AND id != $2',
        [code, id]
      );
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ error: '部门代码已存在' });
      }
    }

    // 如果有父部门，检查父部门是否存在且不能是自己
    if (parent_id) {
      if (parseInt(parent_id) === parseInt(id)) {
        return res.status(400).json({ error: '父部门不能是自己' });
      }
      const parentCheck = await client.query(
        'SELECT id FROM departments WHERE id = $1',
        [parent_id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: '父部门不存在' });
      }
    }

    // 更新部门
    const result = await client.query(
      `UPDATE departments
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           description = $3,
           parent_id = $4,
           sort_order = COALESCE($5, sort_order),
           is_disabled = COALESCE($6, is_disabled),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, code, description, parent_id, sort_order, is_disabled, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: '更新部门失败' });
  } finally {
    client.release();
  }
});

// 删除部门
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // 检查部门是否存在
    const checkResult = await client.query(
      'SELECT id FROM departments WHERE id = $1',
      [id]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '部门不存在' });
    }

    // 检查是否有子部门
    const childrenCheck = await client.query(
      'SELECT COUNT(*) as count FROM departments WHERE parent_id = $1',
      [id]
    );
    if (parseInt(childrenCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: '该部门下有子部门，无法删除' });
    }

    // 检查是否有用户
    const usersCheck = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE department_id = $1',
      [id]
    );
    if (parseInt(usersCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: '该部门下有用户，无法删除' });
    }

    // 删除部门
    await client.query('DELETE FROM departments WHERE id = $1', [id]);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: '删除部门失败' });
  } finally {
    client.release();
  }
});

// 禁用/启用部门
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE departments
       SET is_disabled = NOT is_disabled,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '部门不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle department error:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

export default router;
