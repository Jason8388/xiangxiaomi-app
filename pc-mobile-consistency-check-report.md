# PC端与移动端工单管理一致性检查报告

生成时间：2025-01-22
检查范围：列表、详情、新建/编辑、权限、缓存

---

## 一、列表数据一致性检查

### 1.1 API接口

| 项目 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 接口路径 | GET /api/v1/work-orders | GET /api/v1/work-orders | ✅ 一致 |
| 筛选方式 | 前端筛选 | 前端筛选 | ✅ 一致 |
| 排序方式 | 默认（未指定） | 默认（未指定） | ✅ 一致 |

### 1.2 筛选字段对比

**PC端筛选字段（3个）：**
```typescript
if (searchKeyword) {
  filteredOrders = orders.filter(o =>
    (o.order_no && o.order_no.toLowerCase().includes(keyword)) ||
    (o.description && o.description.toLowerCase().includes(keyword)) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(keyword))
  );
}
```

**移动端筛选字段（5个）：**
```typescript
if (searchKeyword.trim()) {
  const keyword = searchKeyword.toLowerCase();
  filteredOrders = filtered.filter(
    (order) =>
      (order.order_no && order.order_no.toLowerCase().includes(keyword)) ||
      (order.description && order.description.toLowerCase().includes(keyword)) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(keyword)) ||
      (order.device_name && order.device_name.toLowerCase().includes(keyword)) ||
      (order.assignee_name && order.assignee_name.toLowerCase().includes(keyword))
  );
}
```

| 字段 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 工单编号 | ✅ | ✅ | 一致 |
| 工单描述 | ✅ | ✅ | 一致 |
| 客户名称 | ✅ | ✅ | 一致 |
| 设备名称 | ❌ | ✅ | **不一致** |
| 负责人 | ❌ | ✅ | **不一致** |

### 1.3 列表显示字段对比

| 字段 | PC端表格 | 移动端卡片 | 状态 |
|------|----------|-----------|------|
| id | ✅（隐藏） | ✅（传递） | 一致 |
| order_no | ✅ | ✅ | 一致 |
| name / description | ✅ | ✅ | 一致 |
| customer_name | ✅ | ✅ | 一致 |
| device_name | ✅ | ❌ | **不一致** |
| type | ✅ | ✅ | 一致 |
| priority | ✅ | ✅ | 一致 |
| status | ✅ | ✅ | 一致 |
| stage | ✅ | ✅ | 一致 |
| assignee_name | ✅ | ✅ | 一致 |
| quoted_price | ✅ | ✅ | 一致 |
| created_at | ✅ | ❌ | **不一致** |

### 1.4 条数和排序验证

| 检查项 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|------|
| 总条数 | 一致 | 一致 | ✅ |
| 默认排序 | 一致 | 一致 | ✅ |
| 筛选结果 | 部分不一致 | - | ⚠️ |

---

## 二、详情数据一致性检查（严重问题）

### 2.1 API接口

| 项目 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 接口路径 | 无独立页面 | GET /api/v1/work-orders/:id | ❌ |
| 数据来源 | 列表数据 | 详情API | ❌ |

### 2.2 PC端详情显示（弹窗）

PC端没有独立的详情页面，使用弹窗显示，只显示以下10个字段：

```typescript
// 基本信息区块
1. order_no - 工单编号
2. description - 工单描述
3. customer_name - 客户名称
4. device_name - 设备名称

// 其他信息区块
5. type - 类型
6. priority - 优先级
7. status - 状态
8. assignee_name - 负责人
9. quoted_price - 报价
10. created_at - 创建时间
```

### 2.3 移动端详情显示（独立页面）

移动端有独立的详情页面，期望显示40+个字段，分为以下区块：

```typescript
// 1. 基本情况
1. order_no - 工单编号
2. title - 工单名称
3. task_no - 任务号
4. task_leader - 任务负责人
5. implementation_entity - 实施主体

// 2. 工单状态
6. task_phase - 任务阶段
7. task_progress - 任务进度
8. task_status - 任务状态

// 3. 客户信息
9. contacts - 联系人列表 [{name, role, phone}]
10. demand_date - 接到服务需求日期

// 4. 需求信息
11. requirement_description - 需求描述
12. requirement_photos - 需求照片路径

// 5. 服务方案
13. service_plan - 服务方案说明
14. plan_hours - 计划工时
15. planned_completion_date - 计划完成日期
16. material_requirements - 物料需求
17. warranty_status - 质保期状态
18. is_charged - 是否收费
19. quoted_price - 报价金额
20. service_docs - 服务方案文档路径
21. consensus_docs - 客户共识凭证路径
22. consensus_date - 服务方案客户共识日期
23. sales_sub_project_no - 销售子项目号
24. material_code - 物料编码
25. oa_work_order_no - OA系统工单编号
26. contract_id - 合同ID
27. contract_no - 合同编号
28. contract_name - 合同名称
29. progress_notes - 项目最新进度记录

// 6. 实施情况
30. implementer - 实施人
31. implementation_complete_date - 实施完成日期
32. actual_hours - 实际工时投入
33. work_order_docs - 派工单照片路径
34. site_completion_docs - 现场完成照片路径
35. work_order_signer - 派工单签字人

// 7. 回款情况
36. invoice_application - 是否申请开票
37. invoice_completed - 开票是否完成
38. invoice_delivered - 发票是否送达客户
39. planned_payment_date - 计划回款日期
40. actual_payment_date - 实际回款日期
41. payment_progress - 回款进度记录
```

### 2.4 后端API返回数据

**GET /api/v1/work-orders/:id 返回的字段（11个）：**

```typescript
{
  id,
  order_no,
  description,
  customer_id,
  device_id,
  type,
  priority,
  status,
  stage,
  plan_hours,
  is_charged,
  quoted_price,
  assignee_id,
  created_by,
  customer_name,
  device_name,
  assignee_name,
  created_at
}
```

**POST /api/v1/work-orders 接受的字段（40+个）：**
（见上表，包含所有字段）

### 2.5 严重问题

❌ **数据模型不匹配**

1. 后端GET接口只返回简化模型（11个字段）
2. 后端POST接口接受完整模型（40+个字段）
3. 移动端详情页面期望完整模型的数据
4. 结果：移动端详情页面显示的数据不完整

❌ **缺少的字段（30个）**

- title, task_no, task_leader, implementation_entity
- task_phase, task_progress, task_status
- contacts, demand_date
- requirement_description, requirement_photos
- service_plan, planned_completion_date, material_requirements, warranty_status
- service_docs, consensus_docs, consensus_date, sales_sub_project_no, material_code, oa_work_order_no
- contract_id, contract_no, contract_name, progress_notes
- implementer, implementation_complete_date, actual_hours, work_order_docs, site_completion_docs, work_order_signer
- invoice_application, invoice_completed, invoice_delivered, planned_payment_date, actual_payment_date, payment_progress

---

## 三、新建/编辑一致性检查

### 3.1 API接口

| 操作 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 新建 | POST /api/v1/work-orders | POST /api/v1/work-orders | ✅ 一致 |
| 编辑 | PUT /api/v1/work-orders/:id | PUT /api/v1/work-orders/:id | ✅ 一致 |

### 3.2 新建表单字段对比

| 字段 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| description（工单名称） | ✅ | ✅ | 一致 |
| customer_id | ✅ | ✅ | 一致 |
| assignee_id（任务负责人） | ✅ | ✅ | 一致 |
| device_id | ✅ | ✅ | 一致 |
| type | ✅ | ✅ | 一致 |
| stage | ✅ | ✅ | 一致 |
| priority | ✅ | ✅ | 一致 |
| plan_hours | ✅ | ✅ | 一致 |
| is_charged | ✅ | ✅ | 一致 |
| quoted_price | ✅ | ✅ | 一致 |
| **其他30个字段** | ❌ | ✅ | **不一致** |

### 3.3 编辑表单字段对比

| 字段 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| description（工单名称） | ✅ | ✅ | 一致 |
| customer_id | ✅ | ✅ | 一致 |
| assignee_id（任务负责人） | ✅ | ✅ | 一致 |
| device_id | ✅ | ✅ | 一致 |
| type | ✅ | ✅ | 一致 |
| stage | ✅ | ✅ | 一致 |
| priority | ✅ | ✅ | 一致 |
| status | ✅（仅编辑） | ✅（仅编辑） | ✅ 一致 |
| plan_hours | ✅ | ✅ | 一致 |
| is_charged | ✅ | ✅ | 一致 |
| quoted_price | ✅ | ✅ | 一致 |
| **其他30个字段** | ❌ | ✅ | **不一致** |

### 3.4 实时同步验证

| 检查项 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|------|
| PC端新建数据 | ✅ | ✅ | ✅ |
| 移动端可见 | ✅ | ✅ | ✅ |
| 移动端新建数据 | ✅ | ✅ | ✅ |
| PC端可见 | ✅ | ✅ | ✅ |
| PC端编辑数据 | ✅ | ✅ | ✅ |
| 移动端同步更新 | ✅ | ✅ | ✅ |
| 移动端编辑数据 | ✅ | ✅ | ✅ |
| PC端同步更新 | ✅ | ✅ | ✅ |

---

## 四、按钮、操作、权限一致性检查

### 4.1 列表页面操作按钮

| 按钮 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 新建工单 | ✅ | ✅ | 一致 |
| 导出工单 | ✅ | ✅ | 一致 |
| 搜索 | ✅ | ✅ | 一致 |
| 筛选标签 | ✅（4个） | ✅（4个） | 一致 |

### 4.2 列表项操作按钮

| 按钮 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 详情 | ✅ | ✅ | 一致 |
| 编辑 | ✅ | ✅ | 一致 |
| 删除 | ✅ | ✅ | 一致 |
| 下载 | ❌ | ✅ | **不一致** |

### 4.3 详情页面操作

| 操作 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 编辑 | ✅ | ✅ | 一致 |
| 删除 | ✅ | ✅ | 一致 |
| 保存 | ✅ | ✅ | 一致 |
| 取消 | ✅ | ✅ | 一致 |

### 4.4 权限控制

| 权限 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 查看权限 | ✅ | ✅ | 一致 |
| 新建权限 | ✅ | ✅ | 一致 |
| 编辑权限 | ✅ | ✅ | 一致 |
| 删除权限 | ✅ | ✅ | 一致 |
| 导出权限 | ✅ | ✅ | 一致 |

---

## 五、缓存和版本一致性检查

### 5.1 缓存机制

| 项目 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| 列表数据刷新 | 手动刷新 | 手动刷新 | ✅ 一致 |
| 详情数据刷新 | 实时获取 | 实时获取 | ✅ 一致 |
| 本地缓存 | 无 | 无 | ✅ 一致 |

### 5.2 版本确认

| 项目 | PC端 | 移动端 | 状态 |
|------|------|--------|------|
| API版本 | v1 | v1 | ✅ 一致 |
| 数据模型 | 简化 | 完整 | ❌ 不一致 |
| 表单字段 | 11个 | 40+个 | ❌ 不一致 |

---

## 六、问题汇总

### 6.1 P0严重问题（必须立即修复）

1. **后端数据模型不匹配**
   - 问题：GET /api/v1/work-orders/:id只返回11个字段，POST接受40+个字段
   - 影响：移动端详情页面显示数据不完整
   - 修复：修改GET接口返回完整数据模型

2. **PC端列表缺少筛选字段**
   - 问题：PC端只搜索3个字段，移动端搜索5个字段
   - 影响：搜索结果不一致
   - 修复：PC端添加设备名称和负责人字段搜索

3. **PC端列表缺少显示字段**
   - 问题：PC端表格不显示设备名称和创建时间
   - 影响：信息展示不一致
   - 修复：在表格中添加这两列

4. **PC端缺少下载按钮**
   - 问题：PC端列表项没有下载按钮
   - 影响：功能不一致
   - 修复：添加下载按钮

5. **PC端新建/编辑表单字段不完整**
   - 问题：PC端只支持11个字段，移动端支持40+个字段
   - 影响：PC端无法完整创建/编辑工单
   - 修复：PC端表单支持完整字段

### 6.2 P1重要问题（建议修复）

1. **移动端详情页面字段与后端不匹配**
   - 问题：移动端期望40+个字段，但后端只返回11个
   - 影响：详情页面数据缺失
   - 修复：后端GET接口返回完整数据

2. **PC端没有独立的详情页面**
   - 问题：PC端使用弹窗显示详情，信息不完整
   - 影响：无法查看完整工单信息
   - 修复：创建PC端独立详情页面

### 6.3 P2一般问题（可选优化）

1. **筛选标签排序不一致**
   - 问题：PC端和移动端筛选标签顺序不同
   - 影响：用户体验不一致
   - 修复：统一筛选标签顺序

---

## 七、修复方案

### 7.1 方案一：统一为简化模型（推荐用于快速修复）

**优点：**
- 修改量小，快速实施
- 适合当前业务场景

**缺点：**
- 移动端功能受限
- 无法支持完整的工单管理流程

**实施步骤：**
1. 移动端详情页面只显示11个字段
2. 移动端表单只支持11个字段
3. 删除移动端中不支持的30个字段
4. 更新移动端UI，简化为与PC端一致

### 7.2 方案二：统一为完整模型（推荐用于长期发展）

**优点：**
- 功能完整
- 支持完整的工单管理流程
- 适合企业级应用

**缺点：**
- 修改量大
- 需要重新设计PC端UI

**实施步骤：**
1. 后端GET /api/v1/work-orders/:id返回完整数据（40+个字段）
2. PC端创建独立详情页面，显示完整信息
3. PC端表单支持完整字段
4. PC端列表添加下载按钮
5. 统一PC端和移动端的筛选字段

### 7.3 方案三：混合模型（折中方案）

**优点：**
- 平衡了功能复杂度和实现成本
- 适合当前需求

**实施步骤：**
1. 后端GET /api/v1/work-orders/:id返回完整数据
2. PC端详情弹窗显示完整信息（可滚动）
3. PC端表单支持基础字段+高级字段（可展开）
4. PC端列表添加下载按钮
5. PC端筛选添加设备名称和负责人字段

---

## 八、建议采用方案

**推荐方案三（混合模型）**

理由：
1. 移动端UI已经支持完整字段，保留不浪费
2. PC端通过弹窗滚动和可展开表单实现完整功能
3. 修改量适中，可快速实施
4. 保留了功能完整性

### 8.1 实施优先级

**P0立即实施（1-2天）：**
1. 后端GET /api/v1/work-orders/:id返回完整数据
2. PC端详情弹窗显示完整信息
3. PC端列表添加设备名称和创建时间列
4. PC端筛选添加设备名称和负责人字段

**P1短期实施（3-5天）：**
1. PC端表单支持完整字段（基础+高级）
2. PC端列表添加下载按钮
3. 统一筛选标签顺序

**P2长期优化（1-2周）：**
1. PC端创建独立详情页面
2. 添加字段级别权限控制
3. 优化移动端详情页面布局

---

## 九、风险评估

### 9.1 技术风险

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 数据库字段缺失 | 高 | 添加缺失字段到数据库 |
| 性能下降 | 中 | 优化查询，添加缓存 |
| UI布局问题 | 中 | 响应式设计，滚动容器 |

### 9.2 业务风险

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 用户培训成本 | 中 | 提供操作文档 |
| 数据迁移风险 | 高 | 备份数据，分批迁移 |
| 兼容性问题 | 中 | 保留旧API，逐步迁移 |

---

## 十、验证计划

### 10.1 功能验证

| 验证项 | 预期结果 | 负责人 | 时间 |
|--------|----------|--------|------|
| 列表数据一致 | ✅ | 开发 | 修复后 |
| 详情数据一致 | ✅ | 开发 | 修复后 |
| 新建数据同步 | ✅ | 开发 | 修复后 |
| 编辑数据同步 | ✅ | 开发 | 修复后 |
| 筛选结果一致 | ✅ | 开发 | 修复后 |

### 10.2 数据验证

| 验证项 | 预期结果 | 负责人 | 时间 |
|--------|----------|--------|------|
| 字段完整性 | 40+个字段 | 开发 | 修复后 |
| 数据类型正确 | 所有字段类型正确 | 开发 | 修复后 |
| 关联数据正确 | 客户、设备、负责人正确 | 开发 | 修复后 |

---

## 十一、结论

### 11.1 总体评估

| 检查项 | 一致性 | 说明 |
|--------|--------|------|
| 列表数据 | ⭐⭐⭐⭐ | 基本一致，缺少2个筛选字段 |
| 详情数据 | ⭐⭐ | 严重不一致，缺失30个字段 |
| 新建/编辑 | ⭐⭐⭐ | 部分一致，PC端缺少30个字段 |
| 操作按钮 | ⭐⭐⭐⭐ | 基本一致，PC端缺少下载按钮 |
| 权限控制 | ⭐⭐⭐⭐⭐ | 完全一致 |
| 缓存机制 | ⭐⭐⭐⭐⭐ | 完全一致 |
| **总体评分** | **⭐⭐⭐** | **需要大幅优化** |

### 11.2 关键发现

1. ❌ **后端数据模型不一致**（最严重）
   - GET接口返回简化模型
   - POST接口接受完整模型
   - 导致数据不匹配

2. ❌ **PC端功能不完整**
   - 缺少30个字段的编辑
   - 缺少下载按钮
   - 详情信息不完整

3. ⚠️ **筛选功能不一致**
   - PC端只搜索3个字段
   - 移动端搜索5个字段

4. ✅ **API接口一致**
   - 所有CRUD操作使用相同接口
   - 数据实时同步

### 11.3 修复建议

**立即修复（P0）：**
1. 后端GET /api/v1/work-orders/:id返回完整数据
2. PC端详情弹窗显示完整信息
3. PC端筛选添加设备名称和负责人字段
4. PC端列表添加设备名称和创建时间列

**短期优化（P1）：**
1. PC端表单支持完整字段（可展开）
2. PC端列表添加下载按钮
3. 统一筛选标签顺序

**长期优化（P2）：**
1. PC端创建独立详情页面
2. 添加字段级别权限控制
3. 优化移动端详情页面布局

---

## 附录A：完整字段清单

### A.1 基础字段（11个）
```
id, order_no, description, customer_id, device_id, type,
priority, status, stage, plan_hours, is_charged, quoted_price,
assignee_id, created_by, customer_name, device_name,
assignee_name, created_at
```

### A.2 扩展字段（30个）
```
// 基本情况
title, task_no, task_leader, implementation_entity

// 工单状态
task_phase, task_progress, task_status

// 客户信息
contacts, demand_date

// 需求信息
requirement_description, requirement_photos

// 服务方案
service_plan, planned_completion_date, material_requirements,
warranty_status, service_docs, consensus_docs, consensus_date,
sales_sub_project_no, material_code, oa_work_order_no,
contract_id, contract_no, contract_name, progress_notes

// 实施情况
implementer, implementation_complete_date, actual_hours,
work_order_docs, site_completion_docs, work_order_signer

// 回款情况
invoice_application, invoice_completed, invoice_delivered,
planned_payment_date, actual_payment_date, payment_progress
```

---

## 附录B：API接口清单

### B.1 列表接口
```
GET /api/v1/work-orders
  - 返回：简化模型（11个字段）
  - 支持搜索：后端暂不支持，前端筛选
```

### B.2 详情接口
```
GET /api/v1/work-orders/:id
  - 返回：简化模型（11个字段）⚠️
  - 期望：完整模型（40+个字段）
```

### B.3 新建接口
```
POST /api/v1/work-orders
  - 接受：完整模型（40+个字段）
  - 返回：创建成功的工单
```

### B.4 编辑接口
```
PUT /api/v1/work-orders/:id
  - 接受：完整模型（40+个字段）
  - 返回：更新成功的工单
```

### B.5 删除接口
```
DELETE /api/v1/work-orders/:id
  - 返回：删除确认消息
```

### B.6 统计接口
```
GET /api/v1/work-orders/stats
  - 返回：统计数据（5个指标）
```

---

**报告结束**
