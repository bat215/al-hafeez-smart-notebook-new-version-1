import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, Search, UtensilsCrossed } from "lucide-react";
import { subscribeToMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, MenuItem } from "@/lib/firestore";

const CATEGORIES = ["Beverages", "Food", "Snacks", "Other"];

export default function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: "", price: "", category: "Beverages", imageUrl: "" });

  useEffect(() => {
    const unsub = subscribeToMenuItems(setMenuItems);
    return unsub;
  }, []);

  const filtered = menuItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditingItem(null);
    setForm({ name: "", price: "", category: "Beverages", imageUrl: "" });
    setShowForm(true);
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    setForm({ name: item.name, price: String(item.price), category: item.category, imageUrl: item.imageUrl ?? "" });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) return;
    const data = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      imageUrl: form.imageUrl.trim() || undefined,
      enabled: editingItem ? editingItem.enabled : true,
    };
    if (editingItem) {
      await updateMenuItem(editingItem.id, data);
    } else {
      await addMenuItem(data);
    }
    setShowForm(false);
    setEditingItem(null);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this menu item?")) {
      await deleteMenuItem(id);
    }
  }

  async function handleToggle(item: MenuItem) {
    await updateMenuItem(item.id, { enabled: !item.enabled });
  }

  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen pb-20" style={{ background: "hsl(var(--background))" }}>
      {/* Sticky header — always visible while scrolling */}
      <div
        className="sticky top-0 z-20 px-4 pt-5 pb-3 space-y-3"
        style={{ background: "hsl(var(--background))", borderBottom: "1px solid hsl(var(--border))" }}
      >
        {/* Title + Add button row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "hsl(42 60% 54%)" }}>Menu</h1>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{menuItems.length} items</p>
          </div>
          <button
            data-testid="add-item"
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: "hsl(42 60% 54%)", color: "hsl(0 0% 4%)" }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Item
          </button>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <Search size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            data-testid="search-input"
            type="search"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "hsl(var(--foreground))" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
            </button>
          )}
        </div>
      </div>

      {/* Items by category */}
      <div className="px-4 py-4 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "hsl(var(--card))" }}
            >
              <UtensilsCrossed size={24} style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              {search ? "No items match your search" : "No menu items yet"}
            </p>
            {!search && (
              <button
                onClick={openAdd}
                className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-bold"
                style={{ background: "hsl(42 60% 54%)", color: "hsl(0 0% 4%)" }}
              >
                Add your first item
              </button>
            )}
          </motion.div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[10px] font-bold tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {category.toUpperCase()}
                </span>
                <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
                <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    data-testid={`item-${item.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 rounded-2xl p-3 transition-opacity"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      opacity: item.enabled ? 1 : 0.45,
                    }}
                  >
                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "hsl(var(--secondary))" }}
                      >
                        <UtensilsCrossed size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
                      </div>
                    )}

                    {/* Name + price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>
                        {item.name}
                      </p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: "hsl(42 60% 54%)" }}>
                        ₹{item.price}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        data-testid={`toggle-${item.id}`}
                        onClick={() => handleToggle(item)}
                        title={item.enabled ? "Disable" : "Enable"}
                      >
                        {item.enabled
                          ? <ToggleRight size={22} style={{ color: "hsl(42 60% 54%)" }} />
                          : <ToggleLeft size={22} style={{ color: "hsl(var(--muted-foreground))" }} />
                        }
                      </button>
                      <button
                        data-testid={`edit-${item.id}`}
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg"
                        style={{ background: "hsl(var(--secondary))" }}
                      >
                        <Pencil size={13} style={{ color: "hsl(var(--foreground))" }} />
                      </button>
                      <button
                        data-testid={`delete-${item.id}`}
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg"
                        style={{ background: "rgba(239,68,68,0.1)" }}
                      >
                        <Trash2 size={13} style={{ color: "hsl(0 65% 50%)" }} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form — bottom sheet modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="w-full max-w-[430px] rounded-t-3xl flex flex-col"
              style={{
                background: "hsl(0 0% 7%)",
                borderTop: "1px solid hsl(var(--border))",
                maxHeight: "85vh",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: "hsl(var(--border))" }} />
              </div>

              <div className="px-6 pb-8 pt-2 overflow-y-auto flex-1">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>
                    {editingItem ? "Edit Item" : "New Item"}
                  </h2>
                  <button
                    data-testid="close-form"
                    onClick={() => setShowForm(false)}
                    className="p-1.5 rounded-lg"
                    style={{ background: "hsl(var(--secondary))" }}
                  >
                    <X size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Item Name
                    </label>
                    <input
                      data-testid="form-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Chai"
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Price (₹)
                    </label>
                    <input
                      data-testid="form-price"
                      type="number"
                      inputMode="numeric"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Category
                    </label>
                    <select
                      data-testid="form-category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Image URL <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                      data-testid="form-image"
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                  </div>

                  <button
                    data-testid="save-item"
                    onClick={handleSave}
                    disabled={!form.name.trim() || !form.price}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{
                      background: !form.name.trim() || !form.price ? "hsl(var(--border))" : "hsl(42 60% 54%)",
                      color: !form.name.trim() || !form.price ? "hsl(var(--muted-foreground))" : "hsl(0 0% 4%)",
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                    {editingItem ? "Save Changes" : "Add Item"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
