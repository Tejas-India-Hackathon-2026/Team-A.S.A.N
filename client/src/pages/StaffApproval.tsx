import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function StaffApproval() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const profile = trpc.profile.me.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 15_000 });
  useEffect(() => {
    if (!user || profile.isLoading || profile.isError) return;
    if (!profile.data) { setLocation("/onboarding"); return; }
    if (profile.data.role !== "staff" || profile.data.staffApprovalStatus === "approved") setLocation("/dashboard");
  }, [profile.data, profile.isError, profile.isLoading, setLocation, user]);
  const rejected = profile.data?.staffApprovalStatus === "rejected";
  return <DashboardLayout><div className="mx-auto grid min-h-[68vh] max-w-2xl place-items-center py-10 text-center"><section className="w-full rounded-[2rem] border border-slate-100 bg-white p-8 shadow-[0_24px_70px_rgba(18,52,98,0.09)] sm:p-12"><span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${rejected ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>{rejected ? <ShieldAlert className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}</span><p className="mt-6 text-sm font-bold text-blue-700">Staff registration</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">{rejected ? "Registration not approved" : "Approval pending"}</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600">{rejected ? "An administrator did not approve this staff registration. Please contact your CampusFix administrator for assistance." : "Your staff registration has been sent to an administrator for review. Your CampusFix ID and complaint workspace will become available after approval."}</p>{!rejected && <div className="mt-7 rounded-xl bg-blue-50 p-4 text-left text-sm text-blue-900"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><p>We check your status automatically. You may keep this page open or return later.</p></div></div>}<Button variant="outline" onClick={() => profile.refetch()} disabled={profile.isFetching} className="mt-7 rounded-xl bg-white font-bold">{profile.isFetching ? "Checking…" : "Check approval status"}</Button></section></div></DashboardLayout>;
}
