import express from 'express';
import { memoryFiles } from './files';
import { memoryCustomers } from './customers';
import { memoryDevices } from './devices';
import { memoryContracts } from './contracts';
import { memoryMaterials } from './materials';
import { memoryWorkOrders } from './workOrders';

const router = express.Router();

// 通用查询接口
router.get('/search', async (req, res) => {
  try {
    const { type, keyword } = req.query;
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query search error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 合同查询
router.get('/contracts', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json([]);
    }

    // 从内存存储中搜索合同
    const keywordLower = keyword.toLowerCase();
    const filteredContracts = memoryContracts
      .filter((contract) => {
        // 搜索合同名称
        const contractName = (contract.contract_name || '').toLowerCase();
        // 搜索合同编号
        const contractNumber = (contract.contract_number || '').toLowerCase();
        // 搜索客户名称
        const customerName = (contract.customer_name || '').toLowerCase();
        // 搜索标签
        const tags = (contract.tags || []).map((t: string) => t.toLowerCase()).join(' ');
        // 搜索商务经理
        const businessManager = (contract.business_manager || '').toLowerCase();
        // 搜索状态
        const status = (contract.status || '').toLowerCase();

        return (
          contractName.includes(keywordLower) ||
          contractNumber.includes(keywordLower) ||
          customerName.includes(keywordLower) ||
          tags.includes(keywordLower) ||
          businessManager.includes(keywordLower) ||
          status.includes(keywordLower)
        );
      })
      .map((contract) => ({
        id: contract.id,
        contract_name: contract.contract_name,
        contract_number: contract.contract_number,
        customer_name: contract.customer_name,
        contract_amount: contract.contract_amount || 0,
        start_date: contract.sign_date,
        end_date: contract.acceptance_date,
        status: contract.status,
        tags: contract.tags || [],
        created_at: contract.created_at,
      }));

    res.status(200).json(filteredContracts);
  } catch (error) {
    console.error('Query contracts error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 设备查询
router.get('/devices', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json([]);
    }

    // 从内存存储中搜索设备
    const keywordLower = keyword.toLowerCase();
    const filteredDevices = memoryDevices
      .filter((device) => {
        // 搜索设备名称
        const deviceName = (device.device_name || '').toLowerCase();
        // 搜索设备编号
        const deviceNumber = (device.device_number || '').toLowerCase();
        // 搜索设备ID
        const deviceId = (device.device_id || '').toLowerCase();
        // 搜索设备型号
        const deviceModel = (device.device_model || '').toLowerCase();
        // 搜索客户名称
        const customerName = (device.customer_name || '').toLowerCase();
        // 搜索项目名称
        const projectName = (device.project_name || '').toLowerCase();

        return (
          deviceName.includes(keywordLower) ||
          deviceNumber.includes(keywordLower) ||
          deviceId.includes(keywordLower) ||
          deviceModel.includes(keywordLower) ||
          customerName.includes(keywordLower) ||
          projectName.includes(keywordLower)
        );
      })
      .map((device) => ({
        id: device.id,
        device_name: device.device_name,
        device_number: device.device_number,
        device_id: device.device_id || device.factory_serial_number || '',
        device_model: device.device_model,
        customer_name: device.customer_name || null,
        project_name: device.project_name || null,
        status: device.status,
        created_at: device.created_at,
      }));

    res.status(200).json(filteredDevices);
  } catch (error) {
    console.error('Query devices error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 物料查询
router.get('/materials', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json([]);
    }

    // 从内存存储中搜索物料
    const keywordLower = keyword.toLowerCase();
    const filteredMaterials = memoryMaterials
      .filter((material) => {
        // 搜索物料名称、编码、型号、单位、标签、分类
        const materialName = (material.name || material.material_name || '').toLowerCase();
        const materialCode = (material.code || material.material_code || '').toLowerCase();
        const materialModel = (material.spec || material.material_model || '').toLowerCase();
        const unit = (material.unit || '').toLowerCase();
        const category = (material.category || '').toLowerCase();
        const tags = (material.tags || []).map((t: string) => t.toLowerCase()).join(' ');

        return (
          materialName.includes(keywordLower) ||
          materialCode.includes(keywordLower) ||
          materialModel.includes(keywordLower) ||
          unit.includes(keywordLower) ||
          category.includes(keywordLower) ||
          tags.includes(keywordLower)
        );
      })
      .map((material) => ({
        id: material.id,
        material_name: material.name || material.material_name || '',
        material_code: material.code || material.material_code || '',
        material_model: material.spec || material.material_model || '',
        unit: material.unit || '',
        quantity: material.current_stock || material.quantity || 0,
        tags: material.tags || [],
        created_at: material.created_at,
      }));

    res.status(200).json(filteredMaterials);
  } catch (error) {
    console.error('Query materials error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 会议查询
router.get('/meetings', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json([]);
    }

    // 预置会议纪要数据
    const meetings = [
      {
        id: 1,
        minute_id: 'MIN-2024-001',
        meeting_name: '项目启动会议',
        meeting_type: 'project-start',
        meeting_date: '2024-01-15T09:00:00.000Z',
        meeting_location: '第一会议室',
        attendees: '张三、李四、王五',
        topics: '讨论项目目标、时间节点、资源分配',
        key_points: '确定项目启动时间为2月1日，张三负责技术架构，李四负责项目管理',
        customer_name: '测试客户公司',
        project_name: '智能设备管理系统',
        tags: [{ id: 1, tag: '项目启动' }, { id: 2, tag: '重要会议' }],
        file_url: null,
        created_at: '2024-01-15T09:30:00.000Z',
      },
      {
        id: 2,
        minute_id: 'MIN-2024-002',
        meeting_name: '周例会',
        meeting_type: 'department-weekly',
        meeting_date: '2024-01-20T14:00:00.000Z',
        meeting_location: '第二会议室',
        attendees: '张三、李四、王五、赵六',
        topics: '汇报本周工作进展、讨论下周工作计划',
        key_points: '本周完成需求分析，下周开始开发工作',
        customer_name: null,
        project_name: null,
        tags: [{ id: 1, tag: '周例会' }, { id: 2, tag: '工作汇报' }],
        file_url: null,
        created_at: '2024-01-20T15:00:00.000Z',
      },
      {
        id: 3,
        minute_id: 'MIN-2024-003',
        meeting_name: '客户沟通会议',
        meeting_type: 'customer-meeting',
        meeting_date: '2024-01-25T10:00:00.000Z',
        meeting_location: '客户办公室',
        attendees: '张三、李四、客户代表',
        topics: '讨论系统功能需求、技术方案',
        key_points: '客户确认核心功能，需要增加移动端支持',
        customer_name: '测试客户公司',
        project_name: '智能设备管理系统',
        tags: [{ id: 1, tag: '客户沟通' }, { id: 2, tag: '需求讨论' }],
        file_url: null,
        created_at: '2024-01-25T11:00:00.000Z',
      },
    ];

    // 模糊搜索
    const keywordLower = keyword.toLowerCase();
    const filteredMeetings = meetings.filter((meeting) => {
      const name = (meeting.meeting_name || '').toLowerCase();
      const location = (meeting.meeting_location || '').toLowerCase();
      const attendees = (meeting.attendees || '').toLowerCase();
      const topics = (meeting.topics || '').toLowerCase();
      const type = (meeting.meeting_type || '').toLowerCase();
      const date = (meeting.meeting_date || '').toLowerCase();
      const customer = (meeting.customer_name || '').toLowerCase();
      const project = (meeting.project_name || '').toLowerCase();
      const tags = (meeting.tags || [])
        .map((t) => (typeof t === 'string' ? t : t.tag || ''))
        .join(' ')
        .toLowerCase();

      return (
        name.includes(keywordLower) ||
        location.includes(keywordLower) ||
        attendees.includes(keywordLower) ||
        topics.includes(keywordLower) ||
        type.includes(keywordLower) ||
        date.includes(keywordLower) ||
        customer.includes(keywordLower) ||
        project.includes(keywordLower) ||
        tags.includes(keywordLower)
      );
    });

    res.status(200).json(filteredMeetings);
  } catch (error) {
    console.error('Query meetings error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 客户查询
router.get('/customers', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json([]);
    }

    // 从内存存储中搜索客户
    const keywordLower = keyword.toLowerCase();
    const filteredCustomers = memoryCustomers
      .filter((customer) => {
        // 搜索客户名称
        const name = (customer.name || '').toLowerCase();
        // 搜索联系人
        const contactPerson = (customer.contact_person || '').toLowerCase();
        // 搜索联系电话
        const contactPhone = (customer.contact_phone || '').toLowerCase();
        // 搜索邮箱
        const email = (customer.email || '').toLowerCase();
        // 搜索地址
        const address = (customer.address || '').toLowerCase();
        // 搜索行业
        const industry = (customer.industry || '').toLowerCase();
        // 搜索客户等级
        const level = (customer.level || '').toLowerCase();
        // 搜索客户来源
        const source = (customer.source || '').toLowerCase();
        // 搜索业务经理
        const businessManager = (customer.business_manager || '').toLowerCase();

        return (
          name.includes(keywordLower) ||
          contactPerson.includes(keywordLower) ||
          contactPhone.includes(keywordLower) ||
          email.includes(keywordLower) ||
          address.includes(keywordLower) ||
          industry.includes(keywordLower) ||
          level.includes(keywordLower) ||
          source.includes(keywordLower) ||
          businessManager.includes(keywordLower)
        );
      })
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        contact_person: customer.contact_person,
        contact_phone: customer.contact_phone,
        email: customer.email,
        address: customer.address,
        contract_count: customer.contract_count || 0,
        device_count: customer.device_count || 0,
        after_sales_count: 0, // 默认为0，因为当前数据中没有这个字段
        created_at: customer.created_at,
      }));

    res.status(200).json(filteredCustomers);
  } catch (error) {
    console.error('Query customers error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 文件查询
router.get('/files', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json({
        code: 0,
        data: [],
        message: 'success'
      });
    }

    // 从内存存储中搜索文件
    const keywordLower = keyword.toLowerCase();
    const filteredFiles = memoryFiles
      .filter((file) => {
        // 搜索文件名
        const fileName = (file.file_name || '').toLowerCase();
        // 搜索分类
        const category = (file.category || '').toLowerCase();
        // 搜索描述
        const description = (file.description || '').toLowerCase();
        // 搜索标签
        const tags = (file.tags || []).map((t: string) => t.toLowerCase()).join(' ');

        return (
          fileName.includes(keywordLower) ||
          category.includes(keywordLower) ||
          description.includes(keywordLower) ||
          tags.includes(keywordLower)
        );
      })
      .map((file) => ({
        id: file.id,
        file_name: file.file_name,
        file_url: file.file_url || '',
        file_type: file.file_type,
        file_size: file.file_size,
        uploaded_by: file.uploaded_by === 1 ? 'admin' : `用户${file.uploaded_by}`,
        tags: file.tags || [],
        created_at: file.created_at,
        customer_name: file.customer_name || null,
        project_name: file.project_name || null,
        device_name: file.device_name || null,
        device_number: file.device_number || null,
      }));

    res.status(200).json(filteredFiles);
  } catch (error) {
    console.error('Query files error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 工单查询
router.get('/work-orders', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json([]);
    }

    // 从内存存储中搜索工单
    const keywordLower = keyword.toLowerCase();
    const filteredWorkOrders = memoryWorkOrders
      .filter((workOrder) => {
        // 搜索工单标题
        const title = (workOrder.title || '').toLowerCase();
        // 搜索工单编号
        const orderNo = (workOrder.order_no || '').toLowerCase();
        // 搜索任务编号
        const taskNo = (workOrder.task_no || '').toLowerCase();
        // 搜索客户名称
        const customerName = (workOrder.customer_name || '').toLowerCase();
        // 搜索设备名称
        const deviceName = (workOrder.device_name || '').toLowerCase();
        // 搜索类型
        const type = (workOrder.type || '').toLowerCase();
        // 搜索状态
        const status = (workOrder.status || '').toLowerCase();
        // 搜索阶段
        const stage = (workOrder.stage || '').toLowerCase();
        // 搜索优先级
        const priority = (workOrder.priority || '').toLowerCase();

        return (
          title.includes(keywordLower) ||
          orderNo.includes(keywordLower) ||
          taskNo.includes(keywordLower) ||
          customerName.includes(keywordLower) ||
          deviceName.includes(keywordLower) ||
          type.includes(keywordLower) ||
          status.includes(keywordLower) ||
          stage.includes(keywordLower) ||
          priority.includes(keywordLower)
        );
      })
      .map((workOrder) => ({
        id: workOrder.id,
        order_no: workOrder.order_no,
        title: workOrder.title,
        description: workOrder.description,
        customer_name: workOrder.customer_name,
        device_name: workOrder.device_name,
        type: workOrder.type,
        priority: workOrder.priority,
        status: workOrder.status,
        stage: workOrder.stage,
        assignee_name: workOrder.assignee_name,
        created_at: workOrder.created_at,
      }));

    res.status(200).json(filteredWorkOrders);
  } catch (error) {
    console.error('Query work orders error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;
