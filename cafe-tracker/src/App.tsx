import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import SalesEntry from "@/pages/SalesEntry";
import History from "@/pages/History";
import Summary from "@/pages/Summary";
import Menu from "@/pages/Menu";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <div className="flex justify-center min-h-screen" style={{ background: "hsl(var(--background))" }}>
        <div className="w-full max-w-[430px] relative">
          <Switch>
            <Route path="/" component={SalesEntry} />
            <Route path="/history" component={History} />
            <Route path="/summary" component={Summary} />
            <Route path="/menu" component={Menu} />
            <Route component={NotFound} />
          </Switch>
          <BottomNav />
        </div>
      </div>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </TooltipProvider>
  );
}

export default App;
