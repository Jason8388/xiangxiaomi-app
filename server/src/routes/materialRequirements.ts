import express from 'express';

const router = express.Router();

// 内存存储
let memoryMaterialRequirements: any[] = [
  {
    id: 1,
    title: '2026年第一季度物料采购需求',
    description: '生产部门所需的各类物料清单',
    materials: [],
    created_at: new Date().toISOString(),
    created_by: '张经理',
    status: '进行中',
  },
  {
    id: 2,
    title: '维修备件需求单',
    description: '设备维护所需的备品备件',
    materials: [],
    created_at: new Date().toISOString(),
    created_by: '李工',
    status: '已完成',
  },
];
let memoryRequirementId = 3;

// 获取物料需求列表
router.get('/', async (req, res) => {
  try {
    res.json(memoryMaterialRequirements);
  } catch (error) {
    console.error('Material requirements list error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 获取物料需求详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = memoryMaterialRequirements.find((r) => r.id === parseInt(id));
    if (!requirement) {
      return res.status(404).json({ error: '需求单不存在' });
    }
    res.json(requirement);
  } catch (error) {
    console.error('Material requirement detail error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 创建物料需求单
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: '标题不能为空' });
    }

    const newRequirement = {
      id: memoryRequirementId++,
      title,
      description: description || '',
      materials: [],
      created_at: new Date().toISOString(),
      created_by: '当前用户',
      status: '进行中',
    };

    memoryMaterialRequirements.unshift(newRequirement);
    res.status(201).json(newRequirement);
  } catch (error) {
    console.error('Create material requirement error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新物料需求单
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const requirement = memoryMaterialRequirements.find((r) => r.id === parseInt(id));
    if (!requirement) {
      return res.status(404).json({ error: '需求单不存在' });
    }

    if (title !== undefined) requirement.title = title;
    if (description !== undefined) requirement.description = description;

    res.json(requirement);
  } catch (error) {
    console.error('Update material requirement error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除物料需求单
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = memoryMaterialRequirements.findIndex((r) => r.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ error: '需求单不存在' });
    }

    memoryMaterialRequirements.splice(index, 1);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete material requirement error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加物料到需求单
router.post('/:id/materials', async (req, res) => {
  try {
    const { id } = req.params;
    const { material_id, quantity } = req.body;

    const requirement = memoryMaterialRequirements.find((r) => r.id === parseInt(id));
    if (!requirement) {
      return res.status(404).json({ error: '需求单不存在' });
    }

    // 模拟获取物料信息
    const materialInfo = {
      material_id,
      material_name: `物料-${material_id}`,
      material_number: `M${String(material_id).padStart(4, '0')}`,
      quantity,
    };

    requirement.materials.push(materialInfo);
    res.json(requirement);
  } catch (error) {
    console.error('Add material to requirement error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
