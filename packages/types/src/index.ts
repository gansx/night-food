export type HouseholdRole = "owner" | "member";
export type HouseholdMemberStatus = "active" | "inactive" | "removed";
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type OrderStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "preparing"
  | "completed"
  | "cancelled";

export type TaskStatus =
  | "open"
  | "claimed"
  | "in_progress"
  | "submitted"
  | "completed"
  | "cancelled";

export type NavigationItem = {
  href: string;
  label: string;
  description: string;
  background?: string;
  kicker?: string;
};

export type UsernamePasswordCredentials = {
  username: string;
  password: string;
};

export type RegisterAccountPayload = UsernamePasswordCredentials & {
  displayName: string;
};

export type HouseholdBootstrapPayload = {
  householdName: string;
  displayName?: string;
};

export type HouseholdCreatePayload = {
  householdName: string;
};

export type JoinHouseholdByCodePayload = {
  familyCode: string;
};

export type HouseholdInvitationPayload = {
  householdId: string;
  email: string;
  role: HouseholdRole;
};

export type MenuCategoryPayload = {
  householdId: string;
  name: string;
};

export type MenuItemPayload = {
  householdId: string;
  categoryId: string;
  name: string;
  description?: string;
  pricePoints: number;
  imageUrl?: string;
  sortOrder?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
};

export type CreateOrderItemPayload = {
  menuItemId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  householdId: string;
  remark?: string;
  items: CreateOrderItemPayload[];
};

export type CreateTaskPayload = {
  householdId: string;
  title: string;
  description?: string;
  rewardPoints: number;
  dueAt?: string;
};

export type HouseholdSettingsPayload = {
  householdId: string;
  orderingEnabled: boolean;
  taskApprovalRequired: boolean;
  allowNegativePoints: boolean;
  pointsExchangeRate: number;
  announcementText?: string;
  orderingWindowStart?: string;
  orderingWindowEnd?: string;
};

export type UpdateHouseholdMemberPayload = {
  memberId: string;
  role: HouseholdRole;
  status: HouseholdMemberStatus;
};

export type UpdateProfilePayload = {
  displayName: string;
  phone?: string;
};

export const webPrimaryNav: NavigationItem[] = [
  {
    href: "/",
    label: "家庭首页",
    description: "查看家庭公告、积分摘要和最近动态。"
  },
  {
    href: "/order",
    label: "点餐",
    description: "浏览菜单、加入购物车并提交订单。"
  },
  {
    href: "/orders",
    label: "订单",
    description: "查看历史订单和当前状态。"
  },
  {
    href: "/tasks",
    label: "任务",
    description: "领取任务、提交完成并赚取积分。"
  },
  {
    href: "/me",
    label: "我的",
    description: "管理资料、积分和家庭加入状态。"
  }
];

export const householdQuickActions: NavigationItem[] = [
  {
    href: "/order",
    label: "家庭点餐",
    kicker: "家庭菜单",
    description: "保留分类浏览、购物车和积分结算的核心体验。",
    background: "linear-gradient(180deg, #fff5de 0%, #fffaf0 100%)"
  },
  {
    href: "/tasks",
    label: "任务中心",
    kicker: "家庭协作",
    description: "领取和提交家务任务，和积分体系联动。",
    background: "linear-gradient(180deg, #eef9f1 0%, #f8fff9 100%)"
  },
  {
    href: "/orders",
    label: "订单记录",
    kicker: "点餐历史",
    description: "查看当前订单状态，也能回顾过往点餐。",
    background: "linear-gradient(180deg, #fff0ec 0%, #fff8f5 100%)"
  },
  {
    href: "/tasks/new",
    label: "发布任务",
    kicker: "家主入口",
    description: "家主可以快速发布任务并设置奖励积分。",
    background: "linear-gradient(180deg, #f2efff 0%, #faf8ff 100%)"
  }
];

export const adminPrimaryNav: NavigationItem[] = [
  {
    href: "/menu",
    label: "菜单管理",
    description: "维护分类、菜品、定价、图片和上下架。",
    background: "linear-gradient(180deg, #fff4e2 0%, #fffaf3 100%)"
  },
  {
    href: "/orders",
    label: "订单管理",
    description: "推进订单状态、查看明细和处理取消。",
    background: "linear-gradient(180deg, #f0f7ff 0%, #f8fbff 100%)"
  },
  {
    href: "/tasks",
    label: "任务管理",
    description: "发布任务、查看日志、审核完成和关闭任务。",
    background: "linear-gradient(180deg, #effaf2 0%, #fbfffc 100%)"
  },
  {
    href: "/points",
    label: "积分管理",
    description: "查看流水、统计排行并手动加减积分。",
    background: "linear-gradient(180deg, #fff8e5 0%, #fffdf4 100%)"
  },
  {
    href: "/members",
    label: "成员管理",
    description: "查看邀请码、管理家人角色和访问状态。",
    background: "linear-gradient(180deg, #fff0f7 0%, #fff8fc 100%)"
  },
  {
    href: "/settings",
    label: "规则设置",
    description: "配置点餐时间窗、任务审核和家庭公告。",
    background: "linear-gradient(180deg, #f2f3ff 0%, #fafaff 100%)"
  }
];
