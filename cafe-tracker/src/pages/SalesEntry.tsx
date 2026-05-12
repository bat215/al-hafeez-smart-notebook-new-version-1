import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, CheckCircle, CalendarDays, UtensilsCrossed } from "lucide-react";
import { subscribeToMenuItems, addSale, MenuItem, CartItem, PaymentType } from "@/lib/firestore";
import { format } from "date-fns";

const PAYMENT_TYPES: PaymentType[] = ["Cash", "UPI", "Split", "Pending"];

const PAYMENT_COLORS: Record<PaymentType, string> = {
  Cash: "hsl(160 60% 40%)",
  UPI: "hsl(200 70% 50%)",
  Split: "hsl(280 60% 60%)",
  Pending: "hsl(0 65% 50%)",
};

const CATEGORY_ORDER = ["Beverages", "Food", "Snacks"];

export default function SalesEntry() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("Cash");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const unsub = subscribeToMenuItems(setMenuItems);
    return unsub;
  }, []);

  const enabledItems = menuItems.filter((m) => m.enabled);
  const categories = ["All", ...Array.from(new Set(enabledItems.map((i) => i.category))).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  })];
  const displayItems = activeCategory === "All" ? enabledItems : enabledItems.filter((i) => i.category === activeCategory);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function changeQty(menuItemId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((c) => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0);
    });
  }

  function removeItem(menuItemId: string) {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  }

  function getCartQty(itemId: string) {
    return cart.find((c) => c.menuItemId === itemId)?.quantity ?? 0;
  }

  async function saveSale() {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      await addSale({ date: selectedDate, items: cart, total, paymentType });
      setCart([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "hsl(42 60% 54%)" }}>Al-Hafeez</h1>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Smart Notebook</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <CalendarDays size={14} style={{ color: "hsl(42 60% 54%)" }} />
            <input
              data-testid="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs bg-transparent outline-none"
              style={{ color: "hsl(var(--foreground))", colorScheme: "dark" }}
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            data-testid={`category-${cat}`}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{
              background: activeCategory === cat ? "hsl(42 60% 54%)" : "hsl(var(--card))",
              color: activeCategory === cat ? "hsl(0 0% 4%)" : "hsl(var(--muted-foreground))",
              border: `1px solid ${activeCategory === cat ? "transparent" : "hsl(var(--border))"}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="px-4 grid grid-cols-2 gap-3 flex-1">
        <AnimatePresence>
          {displayItems.map((item, i) => {
            const qty = getCartQty(item.id);
            const inCart = qty > 0;
            return (
              <motion.div
                key={item.id}
                data-testid={`menu-item-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => addToCart(item)}
                className="relative rounded-2xl overflow-hidden cursor-pointer select-none active:scale-95 transition-transform"
                style={{
                  background: inCart ? "hsl(0 0% 10%)" : "hsl(var(--card))",
                  border: `1px solid ${inCart ? "hsl(42 60% 54%)" : "hsl(var(--border))"}`,
                }}
              >
                {/* Item image */}
                {item.imageUrl ? (
                  <div className="w-full h-24 overflow-hidden relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const parent = (e.currentTarget as HTMLImageElement).parentElement;
                        if (parent) parent.style.display = "none";
                      }}
                    />
                    {/* Gold gradient overlay at bottom */}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, hsl(0 0% 7%) 0%, transparent 60%)" }}
                    />
                    {/* In-cart badge over image */}
                    {inCart && (
                      <div
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold z-10"
                        style={{ background: "hsl(42 60% 54%)", color: "hsl(0 0% 4%)" }}
                      >
                        {qty}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Placeholder when no image */
                  <div
                    className="w-full h-24 flex items-center justify-center"
                    style={{ background: "hsl(0 0% 8%)" }}
                  >
                    <UtensilsCrossed size={22} style={{ color: "hsl(var(--border))" }} />
                  </div>
                )}

                <div className="p-3 pt-2">
                  {/* Badge when no image */}
                  {!item.imageUrl && inCart && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: "hsl(42 60% 54%)", color: "hsl(0 0% 4%)" }}
                    >
                      {qty}
                    </div>
                  )}
                  <p className="text-xs font-semibold leading-tight pr-5" style={{ color: "hsl(var(--foreground))" }}>{item.name}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: "hsl(42 60% 54%)" }}>₹{item.price}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{item.category}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Cart & Checkout */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4"
          >
            <div
              className="rounded-2xl p-4"
              style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(42 60% 54% / 0.3)" }}
            >
              {/* Cart items */}
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.menuItemId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2"
                    >
                      <span className="flex-1 text-xs truncate" style={{ color: "hsl(var(--foreground))" }}>{item.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          data-testid={`qty-minus-${item.menuItemId}`}
                          onClick={(e) => { e.stopPropagation(); changeQty(item.menuItemId, -1); }}
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "hsl(var(--border))" }}
                        >
                          <Minus size={10} style={{ color: "hsl(var(--foreground))" }} />
                        </button>
                        <span className="text-xs w-4 text-center font-bold" style={{ color: "hsl(42 60% 54%)" }}>{item.quantity}</span>
                        <button
                          data-testid={`qty-plus-${item.menuItemId}`}
                          onClick={(e) => { e.stopPropagation(); changeQty(item.menuItemId, 1); }}
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "hsl(var(--border))" }}
                        >
                          <Plus size={10} style={{ color: "hsl(var(--foreground))" }} />
                        </button>
                      </div>
                      <span className="text-xs w-12 text-right font-semibold" style={{ color: "hsl(var(--foreground))" }}>₹{item.price * item.quantity}</span>
                      <button
                        data-testid={`remove-${item.menuItemId}`}
                        onClick={(e) => { e.stopPropagation(); removeItem(item.menuItemId); }}
                      >
                        <Trash2 size={12} style={{ color: "hsl(0 65% 50%)" }} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Payment type */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {PAYMENT_TYPES.map((pt) => (
                  <button
                    key={pt}
                    data-testid={`payment-${pt}`}
                    onClick={() => setPaymentType(pt)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: paymentType === pt ? PAYMENT_COLORS[pt] : "hsl(var(--card))",
                      color: paymentType === pt ? "#fff" : "hsl(var(--muted-foreground))",
                      border: `1px solid ${paymentType === pt ? PAYMENT_COLORS[pt] : "hsl(var(--border))"}`,
                    }}
                  >
                    {pt}
                  </button>
                ))}
              </div>

              {/* Total + Save */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total</p>
                  <p className="text-2xl font-bold" style={{ color: "hsl(42 60% 54%)" }}>₹{total}</p>
                </div>
                <motion.button
                  data-testid="save-sale"
                  whileTap={{ scale: 0.95 }}
                  onClick={saveSale}
                  disabled={saving || saved}
                  className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                  style={{
                    background: saved ? "hsl(160 60% 40%)" : "hsl(42 60% 54%)",
                    color: "hsl(0 0% 4%)",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saved ? <CheckCircle size={16} /> : null}
                  {saved ? "Saved!" : saving ? "Saving..." : "Save Sale"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
