import { useLocation, Link } from "wouter";
import { ShoppingCart, History, BarChart2, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", label: "Sale", icon: ShoppingCart },
  { path: "/history", label: "History", icon: History },
  { path: "/summary", label: "Summary", icon: BarChart2 },
  { path: "/menu", label: "Menu", icon: UtensilsCrossed },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40"
      style={{ background: "hsl(0 0% 5%)", borderTop: "1px solid hsl(40 15% 18%)" }}
    >
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location === path;
          return (
            <Link key={path} href={path}>
              <motion.div
                data-testid={`nav-${label.toLowerCase()}`}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl cursor-pointer select-none"
                whileTap={{ scale: 0.9 }}
                animate={{ opacity: active ? 1 : 0.5 }}
              >
                <div className="relative">
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "rgba(201,168,76,0.15)" }}
                    />
                  )}
                  <Icon
                    size={22}
                    className="relative z-10"
                    style={{ color: active ? "hsl(42 60% 54%)" : "hsl(40 10% 55%)" }}
                  />
                </div>
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{ color: active ? "hsl(42 60% 54%)" : "hsl(40 10% 55%)" }}
                >
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
