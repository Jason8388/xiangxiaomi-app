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

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  // 登录问题
  {
    id: 'login-1',
    category: '登录问题',
    question: '忘记密码怎么办？',
    answer: '请联系管理员重置密码。管理员账号可以通过后台管理系统为用户重置登录密码。',
  },
  {
    id: 'login-2',
    category: '登录问题',
    question: '登录显示"账号已被禁用"？',
    answer: '您的账号已被管理员禁用，请联系管理员确认原因并恢复账号使用权限。',
  },
  {
    id: 'login-3',
    category: '登录问题',
    question: '如何切换账号？',
    answer: '在"我的"页面点击头像下方的退出按钮，确认退出后返回登录页面，重新输入新账号密码登录。',
  },
  
  // 功能使用
  {
    id: 'func-1',
    category: '功能使用',
    question: '如何添加客户？',
    answer: '进入"客户管理"页面，点击右上角的"新增"按钮，填写客户信息后保存即可。必填项包括客户名称和联系电话。',
  },
  {
    id: 'func-2',
    category: '功能使用',
    question: '一个客户可以关联多个设备吗？',
    answer: '可以的。在新增或编辑设备时，选择对应的客户即可。同一客户可以拥有多台设备。',
  },
  {
    id: 'func-3',
    category: '功能使用',
    question: '如何查看我负责的工单？',
    answer: '进入"快捷查询" → "我的待办"，或进入"工单管理"筛选"我的工单"，即可查看分配给您的工单列表。',
  },
  {
    id: 'func-4',
    category: '功能使用',
    question: '上传的文件支持哪些格式？',
    answer: '支持上传Word（.doc/.docx）、Excel（.xls/.xlsx）、PowerPoint（.ppt/.pptx）、PDF、图片（.jpg/.png）等常见文件格式。单个文件大小限制50MB。',
  },
  {
    id: 'func-5',
    category: '功能使用',
    question: '如何设置工单提醒？',
    answer: '在工单详情页面，点击"设置提醒"按钮，选择提醒时间和提醒方式（应用内通知/短信），系统将在指定时间发送提醒。',
  },
  
  // 权限问题
  {
    id: 'perm-1',
    category: '权限问题',
    question: '为什么我看不到某个功能菜单？',
    answer: '不同角色的用户有不同的功能权限。普通工程师账号可能无法看到管理员专属功能（如账号管理、组织架构等）。请联系管理员开通权限。',
  },
  {
    id: 'perm-2',
    category: '权限问题',
    question: '如何成为管理员？',
    answer: '管理员账号由系统初始化时创建，普通用户需要由现有管理员在"账号管理"中修改角色为管理员。',
  },
  {
    id: 'perm-3',
    category: '权限问题',
    question: '普通员工可以删除数据吗？',
    answer: '默认情况下，普通员工可以编辑和删除自己创建的数据，但无法删除他人创建的数据。管理员可以管理所有数据。',
  },
  
  // 数据问题
  {
    id: 'data-1',
    category: '数据问题',
    question: '删除的数据可以恢复吗？',
    answer: '抱歉，目前系统不支持恢复已删除的数据。请在删除前确认数据是否需要保留，或联系管理员查询是否有数据备份。',
  },
  {
    id: 'data-2',
    category: '数据问题',
    question: '如何导出数据报表？',
    answer: '各管理模块（如客户、设备、合同、工单）都提供"台账"功能，点击进入后可查看汇总数据，支持导出Excel格式。',
  },
  {
    id: 'data-3',
    category: '数据问题',
    question: '数据同步需要网络吗？',
    answer: '是的，应用需要网络连接才能与服务器同步数据。在无网络环境下，应用可以使用本地缓存数据，但无法查看最新数据或进行数据提交。',
  },
  
  // 其他问题
  {
    id: 'other-1',
    category: '其他问题',
    question: '如何更新应用到最新版本？',
    answer: '进入"我的" → "系统版本与更新"，点击"检查更新"按钮，如有新版本会提示下载更新。',
  },
  {
    id: 'other-2',
    category: '其他问题',
    question: 'APP闪退怎么办？',
    answer: '尝试以下方法：1. 重启APP；2. 清除手机后台应用；3. 检查手机存储空间是否充足；4. 更新到最新版本。如仍有问题，请通过"问题反馈"提交具体问题描述。',
  },
  {
    id: 'other-3',
    category: '其他问题',
    question: '如何联系技术支持？',
    answer: '您可以通过以下方式联系我们：\n1. 客服热线：400-888-6668\n2. 工作时间：周一至周五 9:00-18:00\n3. 应用内反馈：进入"帮助与反馈" → "问题反馈"',
  },
];

export default function HelpFAQScreen() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // 按分类分组
  const categories = [...new Set(faqData.map(item => item.category))];
  
  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <Screen>
      <PageHeader title="常见问题" />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 快捷提示 */}
        <View style={styles.tipCard}>
          <FontAwesome6 name="lightbulb" size={24} color="#FDCB6E" />
          <View style={styles.tipText}>
            <Text style={styles.tipTitle}>温馨提示</Text>
            <Text style={styles.tipContent}>
              点击问题展开查看详细解答，如果未找到您的问题，可通过"帮助与反馈"提交新问题
            </Text>
          </View>
        </View>

        {/* FAQ列表 */}
        <View style={styles.contentSection}>
          {categories.map((category) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category}</Text>
              </View>
              
              {faqData
                .filter(item => item.category === category)
                .map((item) => (
                  <View key={item.id} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => toggleItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome6
                        name={expandedItems.includes(item.id) ? 'minus-circle' : 'plus-circle'}
                        size={18}
                        color="#6C63FF"
                      />
                      <Text style={styles.faqQuestion}>{item.question}</Text>
                    </TouchableOpacity>
                    
                    {expandedItems.includes(item.id) && (
                      <View style={styles.faqAnswer}>
                        <Text style={styles.answerText}>{item.answer}</Text>
                      </View>
                    )}
                  </View>
                ))}
            </View>
          ))}
        </View>

        {/* 底部提示 */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>没有找到答案？</Text>
          <Text style={styles.footerText}>
            请通过"帮助与反馈"提交您的问题，我们会尽快回复
          </Text>
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
  tipCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FDCB6E',
    gap: 14,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  tipContent: {
    fontSize: 13,
    color: '#636E72',
    lineHeight: 20,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  faqItem: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 46,
  },
  answerText: {
    fontSize: 13,
    color: '#636E72',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 30,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#636E72',
    textAlign: 'center',
  },
});
