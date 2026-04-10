export type AppRole = "owner" | "member";
export type DashboardTarget = "member" | "owner";
export type MemberStatus = "active" | "inactive" | "removed";
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

export function getDashboardTargetByRole(role: AppRole): DashboardTarget {
  return role === "owner" ? "owner" : "member";
}

export function getRoleDisplayName(role: AppRole): string {
  return role === "owner" ? "家主" : "家人";
}

export function getMemberStatusLabel(status: MemberStatus): string {
  switch (status) {
    case "active":
      return "正常";
    case "inactive":
      return "已停用";
    case "removed":
      return "已移除";
    default:
      return status;
  }
}

export function getInvitationStatusLabel(status: InvitationStatus): string {
  switch (status) {
    case "pending":
      return "待接受";
    case "accepted":
      return "已接受";
    case "expired":
      return "已过期";
    case "revoked":
      return "已撤销";
    default:
      return status;
  }
}

export function buildHouseholdInviteExpiry(hours = 48): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildDisplayNameFallback(email: string): string {
  return normalizeEmail(email).split("@")[0] || "family-member";
}

export function createHouseholdSlug(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${normalized || "household"}-${randomSuffix}`;
}

export function createOrderNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const suffix = Math.random().toString().slice(2, 6);
  return `NF-${y}${m}${d}-${h}${min}${s}${suffix}`;
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "draft":
      return "草稿";
    case "submitted":
      return "待确认";
    case "confirmed":
      return "已确认";
    case "preparing":
      return "制作中";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
}

export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "open":
      return "待领取";
    case "claimed":
      return "已领取";
    case "in_progress":
      return "进行中";
    case "submitted":
      return "待审批";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
}

const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

const taskTransitions: Record<TaskStatus, TaskStatus[]> = {
  open: ["claimed", "cancelled"],
  claimed: ["in_progress", "submitted", "cancelled"],
  in_progress: ["submitted", "cancelled"],
  submitted: ["completed", "cancelled", "open"],
  completed: [],
  cancelled: ["open"]
};

export function getAllowedOrderTransitions(status: OrderStatus): OrderStatus[] {
  return orderTransitions[status] ?? [];
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return getAllowedOrderTransitions(from).includes(to);
}

export function getAllowedTaskTransitions(status: TaskStatus): TaskStatus[] {
  return taskTransitions[status] ?? [];
}

export function canTransitionTaskStatus(from: TaskStatus, to: TaskStatus): boolean {
  return getAllowedTaskTransitions(from).includes(to);
}

function normalizeTimeInput(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length >= 5 ? trimmed.slice(0, 5) : null;
}

function timeToMinutes(value?: string | null): number | null {
  const normalized = normalizeTimeInput(value);
  if (!normalized) {
    return null;
  }

  const [hourText, minuteText] = normalized.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

function getCurrentMinutesInTimezone(timezone: string, now = new Date()): number {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

export function formatOrderingWindow(start?: string | null, end?: string | null): string {
  const normalizedStart = normalizeTimeInput(start);
  const normalizedEnd = normalizeTimeInput(end);

  if (!normalizedStart || !normalizedEnd) {
    return "全天可点";
  }

  return `${normalizedStart} - ${normalizedEnd}`;
}

export function isCurrentTimeWithinWindow(
  timezone: string,
  start?: string | null,
  end?: string | null,
  now = new Date()
): boolean {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === null || endMinutes === null) {
    return true;
  }

  const currentMinutes = getCurrentMinutesInTimezone(timezone, now);
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "未设置";
  }

  return new Date(value).toLocaleString("zh-CN");
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return "未设置";
  }

  return new Date(value).toLocaleDateString("zh-CN");
}
