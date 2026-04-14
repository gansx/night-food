import { formatOrderingWindow, isCurrentTimeWithinWindow } from "@night-food/lib";
import Link from "next/link";
import { MemberShell } from "../_components/member-shell";
import { getWebViewerSummary } from "../../lib/auth";
import { createSupabaseServiceRoleClient } from "../../lib/supabase/service-role-client";
import { OrderComposer } from "./_components/order-composer";

export default async function OrderPage() {
  const viewer = await getWebViewerSummary();

  if (!viewer) {
    return (
      <MemberShell title="家庭点单" description="请先登录后再进行点餐。" activeHref="/order">
        <section className="glass-panel" style={{ padding: 24 }}>
          <Link href="/login" style={{ color: "var(--brand)", fontWeight: 700 }}>
            前往登录
          </Link>
        </section>
      </MemberShell>
    );
  }

  if (!viewer.householdId) {
    return (
      <MemberShell title="家庭点单" description="你还没有加入家庭，暂时无法点餐。" activeHref="/order">
        <section className="glass-panel" style={{ padding: 24, color: "var(--text-muted)" }}>
          请先输入家庭邀请码加入家庭，再回来点餐。{" "}
          <Link href="/family" style={{ color: "var(--brand)", fontWeight: 700 }}>
            前往家庭引导
          </Link>
        </section>
      </MemberShell>
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const [{ data: categories }, { data: items }, { data: settings }, { data: household }] =
    await Promise.all([
      supabase
        .from("menu_categories")
        .select("id, name, sort_order")
        .eq("household_id", viewer.householdId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_items")
        .select("id, category_id, name, description, price_points, image_url, is_available, sort_order")
        .eq("household_id", viewer.householdId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("household_settings")
        .select(
          "ordering_enabled, allow_negative_points, points_exchange_rate, announcement_text, ordering_window_start, ordering_window_end"
        )
        .eq("household_id", viewer.householdId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("households")
        .select("timezone")
        .eq("id", viewer.householdId)
        .limit(1)
        .maybeSingle()
    ]);

  const mergedCategories = (categories ?? []).map((category) => ({
    id: category.id as string,
    name: category.name as string,
    items: (items ?? [])
      .filter((item) => item.category_id === category.id)
      .map((item) => ({
        id: item.id as string,
        name: item.name as string,
        description: (item.description as string | null) ?? null,
        pricePoints: Number(item.price_points),
        imageUrl: (item.image_url as string | null) ?? null,
        isAvailable: Boolean(item.is_available)
      }))
  }));

  const timezone = (household?.timezone as string | undefined) ?? "Asia/Shanghai";
  const orderingWindowLabel = formatOrderingWindow(
    settings?.ordering_window_start as string | null | undefined,
    settings?.ordering_window_end as string | null | undefined
  );
  const orderingEnabled = settings?.ordering_enabled !== false;
  const currentlyOpen = isCurrentTimeWithinWindow(
    timezone,
    settings?.ordering_window_start as string | null | undefined,
    settings?.ordering_window_end as string | null | undefined
  );

  return (
    <MemberShell
      title="家庭点单"
      description="这一页保留旧版小程序最核心的点单体验：分类浏览、菜品选择、购物车和积分结算。"
      activeHref="/order"
    >
      {mergedCategories.length ? (
        <OrderComposer
          householdId={viewer.householdId}
          categories={mergedCategories}
          orderRules={{
            orderingEnabled,
            allowNegativePoints: settings?.allow_negative_points ?? false,
            pointsExchangeRate: Number(settings?.points_exchange_rate ?? 1),
            orderingWindowLabel,
            currentlyOpen,
            announcementText: (settings?.announcement_text as string | null) ?? ""
          }}
        />
      ) : (
        <section className="glass-panel" style={{ padding: 24, color: "var(--text-muted)" }}>
          当前家庭还没有配置菜单。请先让家主前往管理台创建分类和菜品。
        </section>
      )}
    </MemberShell>
  );
}
