import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Award, CalendarDays, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { subscribeSales, Sale, PaymentType } from "@/lib/firestore";
import { format, parseISO, isToday, isThisWeek, isThisMonth, addDays, subDays } from "date-fns";

const PAYMENT_TYPES: PaymentType[] = ["Cash", "UPI", "Split", "Pending"];
const PAYMENT_COLORS: Record<PaymentType, string> = {
  Cash: "hsl(160 60% 40%)",
  UPI: "hsl(200 70% 50%)",
  Split: "hsl(280 60% 60%)",
  Pending: "hsl(0 65% 50%)",
};
const PAYMENT_BG: Record<PaymentType, string> = {
  Cash: "rgba(34,197,94,0.1)",
  UPI: "rgba(59,130,246,0.1)",
  Split: "rgba(168,85,247,0.1)",
  Pending: "rgba(239,68,68,0.1)",
};

type Period = "today" | "week" | "month" | "pick";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  pick: "Pick Date",
};

export default function Summary() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<Period>("today");
  const [pickedDate, setPickedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    const unsub = subscribeSales(setSales);
    return unsub;
  }, []);

  function filterByPeriod(s: Sale) {
    try {
      const d = parseISO(s.date);
      if (period === "today") return isToday(d);
      if (period === "week") return isThisWeek(d, { weekStartsOn: 1 });
      if (period === "month") return isThisMonth(d);
      if (period === "pick") return s.date === pickedDate;
      return false;
    } catch {
      return false;
    }
  }

  function stepDate(dir: 1 | -1) {
    try {
      const d = parseISO(pickedDate);
      setPickedDate(format(dir === 1 ? addDays(d, 1) : subDays(d, 1), "yyyy-MM-dd"));
    } catch { /* empty */ }
  }

  function getRevenueLabel() {
    if (period === "pick") {
      try { return format(parseISO(pickedDate), "dd MMM yyyy"); } catch { return pickedDate; }
    }
    return PERIOD_LABELS[period];
  }

  // ── Derived data (computed first, used in handlers below) ──────────────────
  const periodSales = sales.filter(filterByPeriod);
  const total = periodSales.reduce((s, sale) => s + sale.total, 0);

  const paymentBreakdown = PAYMENT_TYPES.map((pt) => {
    const ptSales = periodSales.filter((s) => s.paymentType === pt);
    return { type: pt, count: ptSales.length, amount: ptSales.reduce((s, sale) => s + sale.total, 0) };
  });

  const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  periodSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!itemCounts[item.menuItemId]) {
        itemCounts[item.menuItemId] = { name: item.name, count: 0, revenue: 0 };
      }
      itemCounts[item.menuItemId].count += item.quantity;
      itemCounts[item.menuItemId].revenue += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  // ── WhatsApp report ────────────────────────────────────────────────────────
  function shareOnWhatsApp() {
    const label = getRevenueLabel();
    const lines: string[] = [];
    lines.push("*Al-Hafeez Smart Notebook*");
    lines.push(`Sales Report — ${label}`);
    lines.push("─────────────────────");
    lines.push(`*Total Revenue: Rs. ${total}*`);
    lines.push(`Total Sales: ${periodSales.length}`);
    lines.push("");
    lines.push("*Payment Breakdown:*");
    paymentBreakdown.forEach(({ type, amount, count }) => {
      if (amount > 0) {
        lines.push(`  ${type}: Rs. ${amount} (${count} ${count === 1 ? "sale" : "sales"})`);
      }
    });
    if (topItems.length > 0) {
      lines.push("");
      lines.push("*Top Items:*");
      topItems.forEach((item, i) => {
        lines.push(`  ${i + 1}. ${item.name} — ${item.count} sold (Rs. ${item.revenue})`);
      });
    }
    lines.push("─────────────────────");
    lines.push("Powered by Al-Hafeez Smart Notebook");
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ background: "hsl(var(--background))" }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 px-4 pt-5 pb-3 space-y-3"
        style={{ background: "hsl(var(--background))", borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "hsl(42 60% 54%)" }}>Summary</h1>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Revenue analytics</p>
          </div>
          {/* WhatsApp share button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={shareOnWhatsApp}
            disabled={total === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: total > 0 ? "hsl(142 70% 40%)" : "hsl(var(--card))",
              color: total > 0 ? "#fff" : "hsl(var(--muted-foreground))",
              border: `1px solid ${total > 0 ? "transparent" : "hsl(var(--border))"}`,
              opacity: total === 0 ? 0.5 : 1,
            }}
            title="Share report on WhatsApp"
          >
            <Send size={13} />
            Share
          </motion.button>
        </div>

        {/* Period selector row */}
        <div className="flex gap-1.5 flex-wrap">
          {(["today", "week", "month", "pick"] as Period[]).map((p) => (
            <button
              key={p}
              data-testid={`period-${p}`}
              onClick={() => setPeriod(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: period === p ? "hsl(42 60% 54%)" : "hsl(var(--card))",
                color: period === p ? "hsl(0 0% 4%)" : "hsl(var(--muted-foreground))",
                border: `1px solid ${period === p ? "transparent" : "hsl(var(--border))"}`,
              }}
            >
              {p === "pick" && <CalendarDays size={11} />}
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Date navigator — only in pick mode */}
        <AnimatePresence>
          {period === "pick" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(42 60% 54% / 0.3)" }}
              >
                <button
                  data-testid="prev-day"
                  onClick={() => stepDate(-1)}
                  className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ background: "hsl(var(--secondary))" }}
                >
                  <ChevronLeft size={14} style={{ color: "hsl(var(--foreground))" }} />
                </button>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <CalendarDays size={13} style={{ color: "hsl(42 60% 54%)" }} />
                  <input
                    data-testid="date-input"
                    type="date"
                    value={pickedDate}
                    onChange={(e) => setPickedDate(e.target.value)}
                    className="text-xs font-semibold bg-transparent outline-none text-center"
                    style={{ color: "hsl(var(--foreground))", colorScheme: "dark" }}
                  />
                </div>
                <button
                  data-testid="next-day"
                  onClick={() => stepDate(1)}
                  className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ background: "hsl(var(--secondary))" }}
                >
                  <ChevronRight size={14} style={{ color: "hsl(var(--foreground))" }} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Total revenue card */}
        <motion.div
          key={period === "pick" ? pickedDate : period}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(42 60% 54% / 0.3)" }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5"
            style={{ background: "hsl(42 60% 54%)", transform: "translate(30%,-30%)" }}
          />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                {getRevenueLabel()} Revenue
              </p>
              <p className="text-4xl font-bold mt-1" style={{ color: "hsl(42 60% 54%)" }}>₹{total}</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                {periodSales.length} {periodSales.length === 1 ? "sale" : "sales"}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(201,168,76,0.1)" }}>
              <TrendingUp size={20} style={{ color: "hsl(42 60% 54%)" }} />
            </div>
          </div>

          {/* Mini payment pills */}
          {total > 0 && (
            <div className="flex gap-2 flex-wrap mt-3 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              {paymentBreakdown.filter(p => p.amount > 0).map(({ type, amount }) => (
                <span
                  key={type}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: PAYMENT_BG[type], color: PAYMENT_COLORS[type] }}
                >
                  {type} ₹{amount}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Payment breakdown */}
        <div>
          <p className="text-xs font-semibold mb-2 px-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            PAYMENT BREAKDOWN
          </p>
          <div className="grid grid-cols-2 gap-2">
            {paymentBreakdown.map(({ type, count, amount }, i) => (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-testid={`payment-summary-${type}`}
                className="rounded-2xl p-3"
                style={{ background: PAYMENT_BG[type], border: `1px solid ${PAYMENT_COLORS[type]}33` }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: PAYMENT_COLORS[type] }} />
                  <p className="text-xs font-medium" style={{ color: PAYMENT_COLORS[type] }}>{type}</p>
                </div>
                <p className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>₹{amount}</p>
                <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {count} {count === 1 ? "sale" : "sales"}
                </p>
                {total > 0 && (
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(amount / total) * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: PAYMENT_COLORS[type] }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top items */}
        <div className="pb-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Award size={13} style={{ color: "hsl(42 60% 54%)" }} />
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>TOP ITEMS</p>
          </div>
          {topItems.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                {period === "pick"
                  ? `No sales on ${getRevenueLabel()}`
                  : "No data for this period"}
              </p>
              {period === "pick" && (
                <p className="text-[10px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Try another date or switch to a different period
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  data-testid={`top-item-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: i === 0 ? "hsl(42 60% 54%)" : "hsl(var(--secondary))",
                      color: i === 0 ? "hsl(0 0% 4%)" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{item.name}</p>
                    <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{item.count} sold</p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: "hsl(42 60% 54%)" }}>₹{item.revenue}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp share — full-width button at bottom */}
        {total > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={shareOnWhatsApp}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: "hsl(142 70% 40%)", color: "#fff" }}
          >
            <Send size={15} />
            Share Report on WhatsApp
          </motion.button>
        )}
      </div>
    </div>
  );
}
