"use client";

import { useEffect, useMemo, useState } from "react";

type MenuCategory = {
  id: string;
  name: string;
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    pricePoints: number;
    imageUrl: string | null;
    isAvailable: boolean;
  }>;
};

export function OrderComposer({
  householdId,
  categories,
  orderRules
}: {
  householdId: string;
  categories: MenuCategory[];
  orderRules: {
    orderingEnabled: boolean;
    allowNegativePoints: boolean;
    pointsExchangeRate: number;
    orderingWindowLabel: string;
    currentlyOpen: boolean;
    announcementText: string;
  };
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("选择菜品后即可提交家庭订单。");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(categories[0]?.id ?? "");
    }
  }, [activeCategoryId, categories]);

  const allItems = useMemo(() => categories.flatMap((category) => category.items), [categories]);
  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? categories[0];
  const selectedItems = allItems.filter((item) => (quantities[item.id] ?? 0) > 0);
  const total = selectedItems.reduce(
    (sum, item) => sum + item.pricePoints * (quantities[item.id] ?? 0),
    0
  );

  async function submitOrder() {
    if (!selectedItems.length) {
      setMessage("请先选择至少一个菜品。");
      return;
    }

    if (!orderRules.orderingEnabled) {
      setMessage("当前家庭已暂停点餐。");
      return;
    }

    if (!orderRules.currentlyOpen) {
      setMessage(`当前不在点餐时间窗内，可点时段为 ${orderRules.orderingWindowLabel}。`);
      return;
    }

    setLoading(true);
    setMessage("正在提交订单...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          householdId,
          remark,
          items: selectedItems.map((item) => ({
            menuItemId: item.id,
            quantity: quantities[item.id]
          }))
        })
      });

      const payload = (await response.json()) as { error?: string; orderNumber?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "提交订单失败");
        return;
      }

      setQuantities({});
      setRemark("");
      setMessage(`订单创建成功：${payload.orderNumber ?? "已生成订单号"}`);
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  const submitDisabled =
    loading || !selectedItems.length || !orderRules.orderingEnabled || !orderRules.currentlyOpen;

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 20
      }}
    >
      <aside className="glass-panel" style={{ padding: 18 }}>
        <h2 className="section-title">菜单分类</h2>
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              style={{
                border: "1px solid var(--border-soft)",
                padding: 14,
                borderRadius: 16,
                background: category.id === activeCategory?.id ? "var(--panel-strong)" : "rgba(255,255,255,0.68)",
                color: "var(--text-main)",
                cursor: "pointer",
                fontWeight: 700,
                textAlign: "left"
              }}
              aria-pressed={category.id === activeCategory?.id}
            >
              {category.name}
            </button>
          ))}
        </div>
      </aside>

      <div style={{ display: "grid", gap: 20 }}>
        {activeCategory ? (
          <section className="glass-panel" style={{ padding: 20 }}>
            <h2 className="section-title">{activeCategory.name}</h2>
            <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
              {activeCategory.items.length ? (
                activeCategory.items.map((item) => {
                  const quantity = quantities[item.id] ?? 0;
                  return (
                    <article key={item.id} className="menu-item-card">
                      {item.imageUrl ? (
                        <img className="menu-item-cover" src={item.imageUrl} alt={item.name} />
                      ) : (
                        <div className="menu-item-cover menu-item-cover-empty">家宴</div>
                      )}
                      <div className="menu-item-info">
                        <div className="menu-item-name">{item.name}</div>
                        <div className="menu-item-points">{item.pricePoints} 积分</div>
                      </div>
                      <div className="menu-item-actions">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantities((current) => ({
                              ...current,
                              [item.id]: Math.max((current[item.id] ?? 0) - 1, 0)
                            }))
                          }
                          style={circleButtonStyle}
                          aria-label={`减少 ${item.name}`}
                        >
                          -
                        </button>
                        <span style={{ minWidth: 24, textAlign: "center" }}>{quantity}</span>
                        <button
                          type="button"
                          disabled={!item.isAvailable}
                          onClick={() =>
                            setQuantities((current) => ({
                              ...current,
                              [item.id]: (current[item.id] ?? 0) + 1
                            }))
                          }
                          style={{
                            ...circleButtonStyle,
                            background: item.isAvailable ? "var(--brand)" : "#3a332e",
                            color: item.isAvailable ? "#1c0b05" : "var(--text-muted)"
                          }}
                          aria-label={`添加 ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div style={{ color: "var(--text-muted)" }}>当前分类还没有菜品。</div>
              )}
            </div>
          </section>
        ) : null}

        <section className="glass-panel" style={{ padding: 20 }}>
          <h2 className="section-title">购物车摘要</h2>
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 18,
              background: "rgba(255,255,255,0.72)",
              border: "1px solid var(--border-soft)",
              color: "var(--text-muted)",
              lineHeight: 1.7
            }}
          >
            <div>点餐开关：{orderRules.orderingEnabled ? "已开启" : "已关闭"}</div>
            <div>点餐时间窗：{orderRules.orderingWindowLabel}</div>
            <div>积分不足：{orderRules.allowNegativePoints ? "允许负积分下单" : "不允许负积分下单"}</div>
            <div>兑换比例：1 积分 = {orderRules.pointsExchangeRate} 点额度</div>
            {orderRules.announcementText ? <div>家庭公告：{orderRules.announcementText}</div> : null}
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
            {selectedItems.length ? (
              selectedItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid var(--border-soft)"
                  }}
                >
                  <span>
                    {item.name} x {quantities[item.id]}
                  </span>
                  <strong>{item.pricePoints * (quantities[item.id] ?? 0)} 积分</strong>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)" }}>购物车还是空的。</div>
            )}
          </div>

          <label style={{ display: "grid", gap: 8, marginTop: 16 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>订单备注</span>
            <textarea
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder="例如：少辣、晚一点做"
              style={{
                borderRadius: 16,
                border: "1px solid var(--border-soft)",
                padding: "14px 16px",
                minHeight: 90,
                resize: "vertical",
                outline: "none",
                background: "rgba(255,255,255,0.82)"
              }}
            />
          </label>

          <p className="section-copy">{message}</p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
              marginTop: 8
            }}
          >
            <div>
              <div style={{ color: "var(--text-muted)" }}>总计</div>
              <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800 }}>{total} 积分</div>
            </div>
            <button
              type="button"
              disabled={submitDisabled}
              onClick={submitOrder}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "14px 22px",
                background: submitDisabled ? "#c6c1b8" : "var(--brand-dark)",
                color: "#fff",
                cursor: submitDisabled ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "提交中..." : "提交订单"}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

const circleButtonStyle = {
  border: 0,
  width: 44,
  height: 44,
  borderRadius: 999,
  background: "rgba(239,159,93,0.12)",
  color: "var(--brand-dark)",
  cursor: "pointer"
} satisfies React.CSSProperties;
