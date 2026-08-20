import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import FilingEntry from "./pages/FilingEntry";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Report from "./pages/Report";
import StaffApproval from "./pages/StaffApproval";
import Ticket from "./pages/Ticket";

function Router() { return <Switch><Route path="/" component={Home} /><Route path="/file-complaint" component={FilingEntry} /><Route path="/onboarding" component={Onboarding} /><Route path="/staff-approval" component={StaffApproval} /><Route path="/dashboard" component={Dashboard} /><Route path="/profile" component={Profile} /><Route path="/report" component={Report} /><Route path="/ticket/:id"><Ticket /></Route><Route path="/confirmed/:id"><Ticket confirmation /></Route><Route path="/admin" component={Admin} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
export default App;
