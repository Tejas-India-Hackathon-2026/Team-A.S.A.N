import { useAuth } from "@/_core/hooks/useAuth";
import { CampusFixBrand } from "@/components/CampusFixBrand";
import { startLogin } from "@/const";
import { getFilingDestination } from "@/lib/filingRoute";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function FilingEntry() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const profile = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (isAuthenticated && !profile.isLoading && !profile.isError) {
      setLocation(getFilingDestination(Boolean(profile.data)));
    }
  }, [isAuthenticated, profile.data, profile.isError, profile.isLoading, setLocation]);

  if (loading || (isAuthenticated && profile.isLoading)) {
    return <main className="grid min-h-screen place-items-center bg-[#f9fbff] px-5 text-slate-900"><div className="w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-[0_24px_70px_rgba(18,52,98,0.09)] sm:p-10"><CampusFixBrand className="justify-center" /><div className="mx-auto mt-9 h-12 w-12 animate-pulse rounded-2xl bg-blue-100" /><p className="mt-5 text-sm font-semibold text-slate-500">Loading your CampusFix account…</p></div></main>;
  }

  return <main className="grid min-h-screen place-items-center overflow-hidden bg-[#f9fbff] px-5 py-8 text-slate-900"><div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_24px_70px_rgba(18,52,98,0.10)]"><div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[32px] border-blue-100" /><div className="grid lg:grid-cols-[0.9fr_1.1fr]"><aside className="relative bg-[#082962] p-7 text-white sm:p-10"><CampusFixBrand className="[&_span:nth-child(2)_.block:first-child]:text-white [&_span:nth-child(2)_.block:last-child]:text-blue-200" /><div className="mt-14"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100"><ShieldCheck className="h-3.5 w-3.5" /> Verified email access</span><h1 className="mt-5 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Raise a complaint with your email.</h1><p className="mt-4 max-w-sm leading-relaxed text-blue-100">Use your email to securely access CampusFix. First-time users finish a short registration before filing.</p></div><div className="mt-12 space-y-4 border-t border-white/10 pt-6">{[["One secure path", "Continue with your email address."], ["First time?", "Register your campus details once."], ["Returning user?", "Go straight to your complaint desk."]].map(([title, detail]) => <div key={title} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ffd43b]" /><div><p className="text-sm font-bold">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-blue-100">{detail}</p></div></div>)}</div></aside><section className="relative p-7 sm:p-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Mail className="h-6 w-6" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Complaint access</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">Continue with email</h2><p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">CampusFix uses a verified email sign-in before storing registration details or allowing complaints to be filed.</p><button type="button" onClick={startLogin} className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-[#0b57d0] px-5 font-extrabold text-white shadow-lg shadow-blue-700/20 transition-colors hover:bg-[#0848af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Create a new CampusFix ID <ArrowRight className="ml-2 h-4 w-4" /></button><div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-slate-100" /><span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">or</span><span className="h-px flex-1 bg-slate-100" /></div><div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-sm font-extrabold text-slate-800">Already registered?</p><p className="mt-1 text-sm leading-relaxed text-slate-500">Use the same verified email to return directly to your CampusFix complaint desk.</p><button type="button" onClick={startLogin} className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Log in with email <ArrowRight className="h-4 w-4" /></button></div><p className="mt-7 text-center text-xs leading-relaxed text-slate-400">By continuing, you agree to use CampusFix only for legitimate campus reports.</p></section></div></div></main>;
}
