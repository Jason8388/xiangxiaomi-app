# 权限集成指南

## 概述

本指南说明如何在各个模块页面中集成权限控制功能，根据用户权限动态显示/隐藏操作按钮。

## 使用方式

### 1. 导入 Hook

```typescript
import { usePermissions } from '@/hooks/usePermissions';
```

### 2. 使用 Hook 获取权限

```typescript
const { hasPermission, isLoading } = usePermissions('module_name');
```

### 3. 根据权限控制按钮显示

```typescript
// 查看权限
if (!hasPermission('view')) {
  return <Text>无权限访问此页面</Text>;
}

// 新增按钮
{hasPermission('add') && (
  <TouchableOpacity onPress={handleAdd}>
    <Text>新增</Text>
  </TouchableOpacity>
)}

// 编辑按钮
{hasPermission('edit') && (
  <TouchableOpacity onPress={handleEdit}>
    <Text>编辑</Text>
  </TouchableOpacity>
)}

// 删除按钮
{hasPermission('delete') && (
  <TouchableOpacity onPress={handleDelete}>
    <Text>删除</Text>
  </TouchableOpacity>
)}
```

## 模块名称列表

以下模块名称可以传递给 `usePermissions` Hook：

- `customers` - 客户管理
- `contracts` - 合同管理
- `devices` - 设备管理
- `work-orders` - 工单管理
- `meeting-minutes` - 会议纪要
- `files` - 文件管理
- `knowledge` - 知识库

## 完整示例

```typescript
import { usePermissions } from '@/hooks/usePermissions';

export default function CustomersPage() {
  const { hasPermission, isLoading } = usePermissions('customers');

  if (isLoading) {
    return <Text>加载中...</Text>;
  }

  // 检查查看权限
  if (!hasPermission('view')) {
    return (
      <Screen>
        <Text>无权限访问此页面</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>客户管理</Text>
        {/* 新增按钮 */}
        {hasPermission('add') && (
          <TouchableOpacity onPress={handleAdd}>
            <FontAwesome6 name="plus" size={20} color="#1E88E5" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={customers}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.name}</Text>
            <View style={styles.actions}>
              {/* 编辑按钮 */}
              {hasPermission('edit') && (
                <TouchableOpacity onPress={() => handleEdit(item.id)}>
                  <FontAwesome6 name="pencil" size={16} color="#1E88E5" />
                </TouchableOpacity>
              )}
              {/* 删除按钮 */}
              {hasPermission('delete') && (
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <FontAwesome6 name="trash" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
```

## 注意事项

1. **加载状态**：始终检查 `isLoading`，避免在权限加载完成前渲染
2. **查看权限**：如果没有查看权限，应该显示友好的提示信息
3. **默认行为**：如果用户没有配置权限，默认允许所有操作（向后兼容）
4. **管理员**：管理员用户（role === 'admin'）始终拥有所有权限
