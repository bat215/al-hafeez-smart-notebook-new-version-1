import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit2, Check, X, ChevronDown, Filter, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { subscribeSales, deleteSale, updateSale, Sale, PaymentType } from "@/lib/firestore";
import { format, parseISO, subDays, addDays } from "date-fns";

const PAYMENT_TYPES: PaymentType[] = ["Cash", "UPI", "Split", "Pending"];
const PAYMENT_COLORS: Record<PaymentType, string> = {
  Cash: "hsl(160 60% 40%)",
  UPI: "hsl(200 70% 50%)",
  Split: "hsl(280 60% 60%)",
  Pending: "hsl(0 65% 50%)",
};

export default function History() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<PaymentType | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPayment, setEditPayment] = useState<PaymentType>("Cash");
  const [showPaymentFilter, setShowPaymentFilter] = useState(false);
  const [dateMode, setDateMode] = useState<"all" | "pick">("all");
  const [pickedDate, setPickedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    const unsub = subscribeSales(setSales);
    return unsub;
  }, []);

  const byPayment =
    paymentFilter === "All" ? sales : sales.filter((s) => s.paymentType === paymentFilter);

  const filtered =
    dateMode === "pick"
      ? byPayment.filter((s) => s.date === pickedDate)
      : byPayment;

  const grouped = filtered.reduce<Record<string, Sale[]>>((acc, sale) => {
    const key = sale.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sale);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  async function handleDelete(id: string) {
    if (confirm("Delete this sale?")) {
      await deleteSale(id);
    }
  }

  async function handleSaveEdit(id: string) {
    await updateSale(id, { paymentType: editPayment });
    setEditingId(null);
  }

  function startEdit(sale: Sale) {
    setEditingId(sale.id);
    setEditPayment(sale.paymentType);
    setExpandedId(null);
  }

  function formatDate(dateStr: string) {
    try {
      return format(parseISO(dateStr), "EEE, dd MMM yyyy");
    } catch {
      return dateStr;
    }
  }

  function stepDate(dir: 1 | -1) {
    try {
      const d = parseISO(pickedDate);
      setPickedDate(format(dir === 1 ? addDays(d, 1) : subDays(d, 1), "yyyy-MM-dd"));
    } catch { /* empty */ }
  }

  const grandTotal = filtered.reduce((s, sale) => s + sale.total, 0);

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ background: "hsl(var(--background))" }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 px-4 pt-5 pb-3 space-y-3"
        style={{ background: "hsl(var(--background))", borderBottom: "1px solid hsl(var(--border))" }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "hsl(42 60% 54%)" }}>History</h1>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {filtered.length} {filtered.length === 1 ? "sale" : "sales"}
              {filtered.length > 0 && (
                <span className="ml-2 font-semibold" style={{ color: "hsl(42 60% 54%)" }}>
                  · ₹{grandTotal} total
                </span>
              )}
            </p>
          </div>

          {/* Payment filter */}
          <button
            data-testid="filter-toggle"
            onClick={() => setShowPaymentFilter(!showPaymentFilter)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
          >
            <Filter size={13} />
            {paymentFilter}
            <ChevronDown size={13} style={{ transform: showPaymentFilter ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>
        </div>

        {/* Payment filter dropdown */}
        <AnimatePresence>
          {showPaymentFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 flex-wrap pb-1">
                {(["All", ...PAYMENT_TYPES] as (PaymentType | "All")[]).map((pt) => (
                  <button
                    key={pt}
                    data-testid={`filter-${pt}`}
                    onClick={() => { setPaymentFilter(pt); setShowPaymentFilter(false); }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: paymentFilter === pt ? "hsl(42 60% 54%)" : "hsl(var(--card))",
                      color: paymentFilter === pt ? "hsl(0 0% 4%)" : "hsl(var(--muted-foreground))",
                      border: `1px solid ${paymentFilter === pt ? "transparent" : "hsl(var(--border))"}`,
                    }}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date mode toggle + picker */}
        <div className="flex items-center gap-2">
          <button
            data-testid="date-all"
            onClick={() => setDateMode("all")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: dateMode === "all" ? "hsl(42 60% 54%)" : "hsl(var(--card))",
              color: dateMode === "all" ? "hsl(0 0% 4%)" : "hsl(var(--muted-foreground))",
              border: `1px solid ${dateMode === "all" ? "transparent" : "hsl(var(--border))"}`,
            }}
          >
            All Dates
          </button>
          <button
            data-testid="date-pick"
            onClick={() => setDateMode("pick")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: dateMode === "pick" ? "hsl(42 60% 54%)" : "hsl(var(--card))",
              color: dateMode === "pick" ? "hsl(0 0% 4%)" : "hsl(var(--muted-foreground))",
              border: `1px solid ${dateMode === "pick" ? "transparent" : "hsl(var(--border))"}`,
            }}
          >
            <CalendarDays size={12} />
            Pick Date
          </button>
        </div>

        {/* Date navigator — shown only in pick mode */}
        <AnimatePresence>
          {dateMode === "pick" && (
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
                  className="p-1.5 rounded-lg"
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
                  className="p-1.5 rounded-lg"
                  style={{ background: "hsl(var(--secondary))" }}
                >
                  <ChevronRight size={14} style={{ color: "hsl(var(--foreground))" }} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sales list */}
      <div className="px-4 py-4 space-y-5">
        {sortedDates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(var(--card))" }}>
              <CalendarDays size={24} style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              {dateMode === "pick" ? `No sales on ${formatDate(pickedDate)}` : "No sales found"}
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {dateMode === "pick" ? "Try another date or switch to All Dates" : "Start recording sales from the Sale tab"}
            </p>
          </motion.div>
        ) : (
          sortedDates.map((date) => {
            const daySales = grouped[date];
            const dayTotal = daySales.reduce((s, sale) => s + sale.total, 0);
            const dayCash = daySales.filter(s => s.paymentType === "Cash").reduce((s, sale) => s + sale.total, 0);
            const dayUPI = daySales.filter(s => s.paymentType === "UPI").reduce((s, sale) => s + sale.total, 0);
            const dayPending = daySales.filter(s => s.paymentType === "Pending").reduce((s, sale) => s + sale.total, 0);

            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Day summary card */}
                <div
                  className="rounded-2xl p-3 mb-2"
                  style={{ background: "hsl(var(--card))", border: "1px solid hsl(42 60% 54% / 0.25)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "hsl(42 60% 54%)" }}>{formatDate(date)}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{daySales.length} sales</span>
                      <span className="text-base font-bold" style={{ color: "hsl(42 60% 54%)" }}>₹{dayTotal}</span>
                    </div>
                  </div>
                  {/* Mini breakdown */}
                  <div className="flex gap-2 flex-wrap">
                    {dayCash > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.12)", color: "hsl(160 60% 40%)" }}>
                        Cash ₹{dayCash}
                      </span>
                    )}
                    {dayUPI > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(59,130,246,0.12)", color: "hsl(200 70% 50%)" }}>
                        UPI ₹{dayUPI}
                      </span>
                    )}
                    {daySales.filter(s => s.paymentType === "Split").reduce((s, sale) => s + sale.total, 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(168,85,247,0.12)", color: "hsl(280 60% 60%)" }}>
                        Split ₹{daySales.filter(s => s.paymentType === "Split").reduce((s, sale) => s + sale.total, 0)}
                      </span>
                    )}
                    {dayPending > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(239,68,68,0.12)", color: "hsl(0 65% 50%)" }}>
                        Pending ₹{dayPending}
                      </span>
                    )}
                  </div>
                </div>

                {/* Individual sales */}
                <div className="space-y-2 pl-1">
                  {daySales.map((sale) => (
                    <div
                      key={sale.id}
                      data-testid={`sale-${sale.id}`}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    >
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                      >
                        <div
                          className="w-2 h-10 rounded-full flex-shrink-0"
                          style={{ background: PAYMENT_COLORS[sale.paymentType] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate" style={{ color: "hsl(var(--foreground))" }}>
                            {sale.items.map((i) => `${i.name}×${i.quantity}`).join(", ")}
                          </p>
                          <p className="text-[10px] mt-0.5 font-medium" style={{ color: PAYMENT_COLORS[sale.paymentType] }}>
                            {sale.paymentType}
                          </p>
                        </div>
                        <p className="font-bold text-sm flex-shrink-0" style={{ color: "hsl(42 60% 54%)" }}>₹{sale.total}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(sale); }}
                          data-testid={`edit-${sale.id}`}
                          className="p-1"
                        >
                          <Edit2 size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(sale.id); }}
                          data-testid={`delete-${sale.id}`}
                          className="p-1"
                        >
                          <Trash2 size={13} style={{ color: "hsl(0 65% 50%)" }} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {/* Expanded item breakdown */}
                        {expandedId === sale.id && editingId !== sale.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                              {sale.items.map((item) => (
                                <div key={item.menuItemId} className="flex justify-between py-1">
                                  <span className="text-xs" style={{ color: "hsl(var(--foreground))" }}>{item.name} ×{item.quantity}</span>
                                  <span className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Edit payment type */}
                        {editingId === sale.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                              <p className="text-[10px] mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Change payment type</p>
                              <div className="flex gap-2 flex-wrap mb-3">
                                {PAYMENT_TYPES.map((pt) => (
                                  <button
                                    key={pt}
                                    data-testid={`edit-payment-${pt}`}
                                    onClick={() => setEditPayment(pt)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                      background: editPayment === pt ? PAYMENT_COLORS[pt] : "hsl(var(--secondary))",
                                      color: editPayment === pt ? "#fff" : "hsl(var(--muted-foreground))",
                                    }}
                                  >
                                    {pt}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  data-testid="save-edit"
                                  onClick={() => handleSaveEdit(sale.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                                  style={{ background: "hsl(160 60% 40%)", color: "#fff" }}
                                >
                                  <Check size={12} /> Save
                                </button>
                                <button
                                  data-testid="cancel-edit"
                                  onClick={() => setEditingId(null)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                                  style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
                                >
                                  <X size={12} /> Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
