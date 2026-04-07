import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PageHeader } from '@/components/PageHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface ManualSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: ManualItem[];
}

interface ManualItem {
  title: string;
  content: string;
}

const manualSections: ManualSection[] = [
  {
    id: 'login',
    title: '登录与账号',
    icon: 'user-circle',
    color: '#6C63FF',
    items: [
      {
        title: '如何登录？',
        content: '打开APP后，在登录页面输入用户名（或手机号）和密码，点击"登录"按钮即可进入系统。默认管理员账号：admin，密码：mc6668',
      },
      {
        title: '如何修改密码？',
        content: '进入"我的"页面 → 点击"账号设置" → 点击"修改密码" → 输入原密码和新密码 → 确认提交',
      },
      {
        title: '如何设置个人签名？',
        content: '进入"我的"页面 → 点击"账号设置" → 点击"个人签名" → 输入签名内容（最多100字）→ 保存',
      },
      {
        title: '如何更换头像？',
        content: '进入"我的"页面 → 点击"账号设置" → 点击头像区域 → 从相册选择图片 → 裁剪确认上传',
      },
    ],
  },
  {
    id: 'customers',
    title: '客户管理',
    icon: '-users',
    color: '#00B894',
    items: [
      {
        title: '如何添加新客户？',
        content: '进入"客户管理"页面 → 点击右上角"新增"按钮 → 填写客户信息（名称、联系人、联系电话、地址等）→ 保存提交',
      },
      {
        title: '如何查看客户详情？',
        content: '在客户列表点击任意客户卡片 → 进入客户详情页，可查看基本信息、关联的设备、合同、工单等',
      },
      {
        title: '如何编辑客户信息？',
        content: '进入客户详情页 → 点击右上角"编辑"按钮 → 修改信息 → 保存',
      },
      {
        title: '如何删除客户？',
        content: '在客户详情页 → 点击右上角"更多" → 选择"删除" → 确认删除（注意：删除后数据无法恢复）',
      },
    ],
  },
  {
    id: 'devices',
    title: '设备管理',
    icon: 'satellite-dish',
    color: '#3498DB',
    items: [
      {
        title: '如何登记新设备？',
        content: '进入"设备管理"页面 → 点击"新增设备" → 填写设备信息（设备名称、型号、序列号、出厂日期等）→ 上传设备照片 → 保存',
      },
      {
        title: '如何绑定客户？',
        content: '新增或编辑设备时，在"所属客户"栏选择对应的客户，即可将设备关联到指定客户名下',
      },
      {
        title: '如何查看设备历史？',
        content: '在设备列表点击设备卡片 → 进入详情页 → 点击"历史记录"查看设备的维修、保养等历史信息',
      },
      {
        title: '如何导出设备台账？',
        content: '进入"设备管理" → 点击右上角"台账" → 可查看所有设备的汇总信息，支持导出',
      },
    ],
  },
  {
    id: 'materials',
    title: '物料管理',
    icon: 'box-open',
    color: '#FDCB6E',
    items: [
      {
        title: '如何新增物料？',
        content: '进入"物料管理"页面 → 点击"新增物料" → 填写物料信息（名称、规格、分类、单位、库存等）→ 保存',
      },
      {
        title: '如何扫码添加物料？',
        content: '点击物料列表页的扫码按钮 → 扫描物料条形码 → 系统自动识别并填充物料信息 → 确认添加',
      },
      {
        title: '如何设置物料标签？',
        content: '新增或编辑物料时，点击"标签"选项 → 选择预设标签或自定义新标签 → 保存',
      },
      {
        title: '如何查看库存预警？',
        content: '进入"物料管理" → 点击"库存预警"标签页 → 查看低于安全库存的物料列表',
      },
    ],
  },
  {
    id: 'contracts',
    title: '合同管理',
    icon: 'file-signature',
    color: '#E17055',
    items: [
      {
        title: '如何新建合同？',
        content: '进入"合同管理"页面 → 点击"新增合同" → 选择关联客户 → 填写合同信息（合同名称、编号、金额、签订日期、到期日期等）→ 上传合同附件 → 保存',
      },
      {
        title: '如何上传合同附件？',
        content: '新建或编辑合同时，点击"上传附件" → 选择文件（支持Word、Excel、PDF、图片等格式）→ 确认上传',
      },
      {
        title: '如何查看合同台账？',
        content: '进入"合同管理" → 点击右上角"台账" → 查看所有合同的汇总信息，包括即将到期的合同',
      },
      {
        title: '如何续签合同？',
        content: '找到需要续签的合同 → 点击进入详情 → 点击"续签"按钮 → 填写新合同信息',
      },
    ],
  },
  {
    id: 'workorders',
    title: '工单管理',
    icon: 'clipboard-list',
    color: '#9B59B6',
    items: [
      {
        title: '如何创建工单？',
        content: '进入"工单管理"页面 → 点击"新建工单" → 选择工单类型（安装、维修、保养、巡检等）→ 关联客户和设备 → 填写问题描述 → 选择处理人员 → 保存',
      },
      {
        title: '如何处理工单？',
        content: '在工单列表点击工单 → 进入详情页 → 点击"开始处理" → 填写处理过程 → 上传处理照片 → 完成处理',
      },
      {
        title: '如何查看工单统计？',
        content: '进入"工单管理" → 点击"统计"标签 → 查看今日工单、待处理、进行中、已完成等各类统计',
      },
      {
        title: '如何转派工单？',
        content: '在工单详情页 → 点击"转派" → 选择新的处理人员 → 确认转派',
      },
    ],
  },
  {
    id: 'aftersales',
    title: '售后服务',
    icon: 'headset',
    color: '#00CEC9',
    items: [
      {
        title: '如何提交售后申请？',
        content: '进入"售后服务"页面 → 点击"新建售后" → 选择售后类型 → 关联客户和设备 → 填写问题描述 → 提交',
      },
      {
        title: '如何查看售后进度？',
        content: '进入"售后服务" → 选择状态标签（待处理/处理中/已完成）→ 查看对应的售后单列表',
      },
      {
        title: '如何处理售后单？',
        content: '点击售后单进入详情 → 点击"开始处理" → 填写处理方案 → 上传处理照片 → 完成处理',
      },
      {
        title: '如何进行售后审核？',
        content: '管理员进入"售后审核"页面 → 查看待审核的售后单 → 审核通过或驳回',
      },
    ],
  },
  {
    id: 'meetings',
    title: '会议纪要',
    icon: 'calendar-check',
    color: '#74B9FF',
    items: [
      {
        title: '如何新建会议纪要？',
        content: '进入"会议纪要"页面 → 点击"新增纪要" → 填写会议信息（名称、参会人、地点、日期等）→ 填写会议要点和结论 → 添加标签 → 保存',
      },
      {
        title: '如何添加自定义标签？',
        content: '新建或编辑会议纪要时，点击"添加标签" → 输入标签名称 → 创建新标签或选择已有标签',
      },
      {
        title: '如何快速搜索会议？',
        content: '在会议纪要列表页顶部搜索框 → 输入关键词 → 点击搜索 → 查看匹配结果',
      },
      {
        title: '如何按标签筛选？',
        content: '点击标签筛选栏 → 选择需要筛选的标签 → 查看该标签下的所有会议纪要',
      },
    ],
  },
  {
    id: 'knowledge',
    title: '知识库',
    icon: 'book',
    color: '#A29BFE',
    items: [
      {
        title: '如何创建知识卡片？',
        content: '进入"知识库" → 点击"新建知识卡" → 填写标题、分类、内容 → 上传附件（支持Word、Excel、PPT、PDF、图片）→ 保存',
      },
      {
        title: '如何分类管理知识？',
        content: '创建知识卡时选择分类（如：技术文档、操作手册、常见问题等），也支持按分类标签筛选查看',
      },
      {
        title: '如何搜索知识？',
        content: '在知识库顶部搜索框 → 输入关键词 → 点击搜索 → 查看包含关键词的知识卡片',
      },
      {
        title: '如何上传文档附件？',
        content: '新建或编辑知识卡时，点击"添加附件" → 选择文件（支持doc/docx/xls/xlsx/ppt/pptx/pdf/jpg/png等格式）→ 确认上传',
      },
    ],
  },
  {
    id: 'files',
    title: '文件管理',
    icon: 'folder-open',
    color: '#F8B500',
    items: [
      {
        title: '如何上传文件？',
        content: '进入"文件管理" → 点击"上传文件" → 选择文件（支持Word、Excel、PPT、PDF）→ 添加标签 → 确认上传',
      },
      {
        title: '如何按标签分类？',
        content: '点击标签栏选择标签 → 只显示该标签下的文件；也可在上传时为文件添加标签',
      },
      {
        title: '如何预览文件？',
        content: '点击文件进入详情页 → 点击"预览"按钮 → 在线查看文件内容',
      },
      {
        title: '如何下载文件？',
        content: '在文件详情页 → 点击"下载"按钮 → 文件将保存到手机本地',
      },
    ],
  },
  {
    id: 'organization',
    title: '组织架构',
    icon: 'sitemap',
    color: '#2D3436',
    items: [
      {
        title: '如何查看组织架构？',
        content: '进入"组织架构"页面 → 查看树形结构展示的部门层级关系',
      },
      {
        title: '如何新增部门？',
        content: '点击右上角"新增部门" → 选择上级部门 → 填写部门名称 → 保存',
      },
      {
        title: '如何编辑部门？',
        content: '点击部门卡片 → 点击"编辑" → 修改部门名称 → 保存',
      },
      {
        title: '如何删除部门？',
        content: '点击部门卡片 → 点击"删除" → 确认删除（注意：删除后该部门下的员工需要重新分配）',
      },
    ],
  },
  {
    id: 'query',
    title: '快捷查询',
    icon: 'search',
    color: '#00B894',
    items: [
      {
        title: '扫码查询是什么？',
        content: '进入"快捷查询" → 点击"扫码查询" → 扫描设备上的二维码/条形码 → 快速查看设备信息',
      },
      {
        title: '如何进行分类查询？',
        content: '在快捷查询页面，选择查询类型（客户/设备/合同/物料等）→ 输入查询条件 → 查看结果',
      },
      {
        title: '如何查看我的待办？',
        content: '点击"我的待办"标签 → 查看分配给自己的工单、售后等任务列表',
      },
      {
        title: '如何设置提醒？',
        content: '在工单、合同等详情页 → 点击"设置提醒" → 选择提醒时间和方式',
      },
    ],
  },
];

export default function HelpManualScreen() {
  const router = useSafeRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getItemId = (sectionId: string, index: number) => `${sectionId}-${index}`;

  return (
    <Screen>
      <PageHeader title="产品操作手册" />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 简介 */}
        <View style={styles.introCard}>
          <FontAwesome6 name="book-open" size={32} color="#6C63FF" />
          <View style={styles.introText}>
            <Text style={styles.introTitle}>欢迎使用项小秘</Text>
            <Text style={styles.introSubtitle}>
              本手册包含完整的功能操作指南，点击各模块展开查看详情
            </Text>
          </View>
        </View>

        {/* 目录 */}
        <View style={styles.tocSection}>
          <Text style={styles.sectionTitle}>目录导航</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tocContainer}
          >
            {manualSections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[styles.tocItem, { backgroundColor: section.color }]}
                onPress={() => {
                  toggleSection(section.id);
                  // 滚动到对应位置
                }}
              >
                <FontAwesome6 name={section.icon as any} size={20} color="#FFF" />
                <Text style={styles.tocText}>{section.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 详细内容 */}
        <View style={styles.contentSection}>
          {manualSections.map((section) => (
            <View key={section.id} style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.sectionIcon, { backgroundColor: section.color }]}>
                  <FontAwesome6 name={section.icon as any} size={18} color="#FFF" />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <FontAwesome6
                  name={expandedSections.includes(section.id) ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#B2BEC3"
                />
              </TouchableOpacity>

              {expandedSections.includes(section.id) && (
                <View style={styles.sectionContent}>
                  {section.items.map((item, index) => {
                    const itemId = getItemId(section.id, index);
                    return (
                      <View key={itemId} style={styles.item}>
                        <TouchableOpacity
                          style={styles.itemHeader}
                          onPress={() => toggleItem(itemId)}
                          activeOpacity={0.7}
                        >
                          <FontAwesome6
                            name={expandedItems.includes(itemId) ? 'minus-circle' : 'plus-circle'}
                            size={16}
                            color={section.color}
                          />
                          <Text style={styles.itemTitle}>{item.title}</Text>
                        </TouchableOpacity>
                        
                        {expandedItems.includes(itemId) && (
                          <View style={styles.itemContent}>
                            <Text style={styles.itemText}>{item.content}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 底部 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>如有更多问题，请联系客服：400-888-6668</Text>
          <Text style={styles.versionText}>项小秘 v1.0.0</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    gap: 16,
  },
  introText: {
    flex: 1,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 13,
    color: '#636E72',
    lineHeight: 20,
  },
  tocSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  tocContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  tocText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
  },
  itemContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingLeft: 42,
  },
  itemText: {
    fontSize: 13,
    color: '#636E72',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#636E72',
  },
  versionText: {
    fontSize: 12,
    color: '#B2BEC3',
  },
});
