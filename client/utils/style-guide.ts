/**
 * 全局样式规范
 *
 * 设计标准：
 * - 标题字体：18px（加粗）
 * - 正文字体：14px
 * - 主色调：#1E88E5（蓝色）
 * - 辅助色：#F5F7FA（灰色）
 * - 版式间距：统一 16px
 * - 日期格式：YYYY-MM-DD
 * - 时间格式：HH:MM:SS
 */

// 颜色规范
export const Colors = {
  // 主色调
  primary: '#1E88E5',
  primaryLight: '#42A5F5',
  primaryDark: '#1565C0',

  // 辅助色
  background: '#F5F7FA',
  surface: '#FFFFFF',

  // 文字颜色
  text: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#B2BEC3',

  // 状态色
  success: '#00B894',
  warning: '#FDCB6E',
  danger: '#FF6B6B',
  info: '#1E88E5',

  // 边框色
  border: '#DFE6E9',
};

// 字体规范
export const Typography = {
  // 标题字体（18px 加粗）
  title: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },

  // 正文字体（14px）
  body: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    color: Colors.text,
  },

  // 小字体（12px）
  small: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    color: Colors.textSecondary,
  },
};

// 间距规范
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16, // 统一间距
  lg: 24,
  xl: 32,
};

// 圆角规范
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

// 阴影规范
export const Shadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// 日期时间格式化工具
export const DateTimeUtils = {
  /**
   * 格式化日期为 YYYY-MM-DD
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 格式化时间为 HH:MM:SS
   */
  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },

  /**
   * 格式化日期时间为 YYYY-MM-DD HH:MM:SS
   */
  formatDateTime(date: Date | string): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  },

  /**
   * 获取当前日期 YYYY-MM-DD
   */
  getCurrentDate(): string {
    return this.formatDate(new Date());
  },

  /**
   * 获取当前时间 HH:MM:SS
   */
  getCurrentTime(): string {
    return this.formatTime(new Date());
  },

  /**
   * 获取当前日期时间 YYYY-MM-DD HH:MM:SS
   */
  getCurrentDateTime(): string {
    return this.formatDateTime(new Date());
  },

  /**
   * 解析日期时间字符串
   */
  parseDateTime(dateTimeStr: string): Date {
    return new Date(dateTimeStr);
  },

  /**
   * 获取时间段的开始日期
   */
  getPeriodStartDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.formatDate(date);
  },

  /**
   * 获取时间段的结束日期
   */
  getPeriodEndDate(): string {
    return this.getCurrentDate();
  },
};

// 样式类生成器
export const StyleSheet = {
  // 标题样式
  title: {
    ...Typography.title,
    marginBottom: Spacing.md,
  },

  // 正文样式
  body: {
    ...Typography.body,
    lineHeight: 20,
  },

  // 小字样式
  small: {
    ...Typography.small,
    lineHeight: 16,
  },

  // 卡片容器
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },

  // 按钮主样式
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // 按钮次样式
  buttonSecondary: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  buttonSecondaryText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // 输入框样式
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
};
