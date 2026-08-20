import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { hostelOptions, isCampusHostel } from "@/lib/hostelOptions";
import { complaintCategoryNames, type ComplaintCategoryName } from "@shared/complaintCategories";
import { BadgeCheck, Building2, FileBadge2, Loader2, Mail, PencilLine, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Gender = "Female" | "Male" | "Non-binary" | "Prefer not to say";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const profile = trpc.profile.me.useQuery(undefined, { enabled: Boolean(user) });
  const [name, setName] = useState("");
  const [hostel, setHostel] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [staffWorkingFields, setStaffWorkingFields] = useState<ComplaintCategoryName[]>([]);
  const role = profile.data?.role ?? "student";
  const isStudent = role === "student";
  const mobileRequired = isStudent && Boolean(gender) && gender !== "Female";
  const isDirty = Boolean(profile.data) && (
    name !== (profile.data?.name ?? "")
    || hostel !== (profile.data?.hostel ?? "")
    || gender !== (profile.data?.gender ?? "")
    || mobileNumber !== (profile.data?.mobileNumber ?? "")
    || rollNumber !== (profile.data?.rollNumber ?? "")
    || registrationNumber !== (profile.data?.registrationNumber ?? "")
    || JSON.stringify(staffWorkingFields) !== JSON.stringify(profile.data?.staffWorkingFields ?? [])
  );

  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.name || user?.name || "");
    setHostel(profile.data.hostel);
    setGender(profile.data.gender as Gender);
    setMobileNumber(profile.data.mobileNumber ?? "");
    setRollNumber(profile.data.rollNumber ?? "");
    setRegistrationNumber(profile.data.registrationNumber ?? "");
    setStaffWorkingFields(profile.data.staffWorkingFields ?? []);
  }, [profile.data, user?.name]);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.me.invalidate();
      toast.success("Your profile details have been saved.");
    },
    onError: error => toast.error(error.message),
  });

  const saveProfile = () => {
    if (!isCampusHostel(hostel)) return toast.error("Please select your hostel.");
    if (!gender) return toast.error("Please select your gender.");
    if (isStudent && !rollNumber.trim()) return toast.error("Please add your roll number.");
    if (isStudent && !registrationNumber.trim()) return toast.error("Please add your registration number.");
    if (!isStudent && staffWorkingFields.length === 0) return toast.error("Please select at least one working field.");
    if (mobileRequired && !mobileNumber.trim()) return toast.error("Please add your mobile number.");
    updateProfile.mutate({
      name,
      hostel,
      gender: gender as Gender,
      role,
      mobileNumber: mobileNumber.trim() || null,
      rollNumber: rollNumber.trim() || null,
      registrationNumber: registrationNumber.trim() || null,
      staffWorkingFields,
    });
  };

  const discardChanges = () => {
    setName(profile.data?.name ?? user?.name ?? "");
    setHostel(profile.data?.hostel ?? "");
    setGender(profile.data?.gender as Gender ?? "");
    setMobileNumber(profile.data?.mobileNumber ?? "");
    setRollNumber(profile.data?.rollNumber ?? "");
    setRegistrationNumber(profile.data?.registrationNumber ?? "");
    setStaffWorkingFields(profile.data?.staffWorkingFields ?? []);
  };

  if (!user || profile.isLoading) return <DashboardLayout><LoadingProfile /></DashboardLayout>;
  if (!profile.data) return <DashboardLayout><MissingProfile onRegister={() => setLocation("/onboarding?next=/profile")} /></DashboardLayout>;

  return <DashboardLayout><div className="mx-auto max-w-5xl py-2 sm:py-5">
    <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-blue-700">Student account</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">Your profile</h1><p className="mt-2 text-sm text-slate-500">Keep your campus details current so your complaints can be routed correctly.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><BadgeCheck className="h-4 w-4" /> Registered student</span></div>
    <div className="mt-7 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="rounded-2xl bg-[#082962] p-7 text-white"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#ffd43b]"><UserRound className="h-6 w-6" /></span><h2 className="mt-6 text-2xl font-extrabold tracking-[-0.04em]">Your campus identity</h2><p className="mt-3 text-sm leading-relaxed text-blue-100">These details are used only to support your CampusFix registration and complaint workflow.</p><div className="mt-8 space-y-4 border-t border-white/10 pt-6"><ProfileSummary icon={Mail} label="Account email" value={user.email || "Not available"} /><ProfileSummary icon={Building2} label="Campus role" value={role === "staff" ? "Staff" : "Student"} />{isStudent && <><ProfileSummary icon={FileBadge2} label="Roll number" value={rollNumber || "Not set"} /><ProfileSummary icon={FileBadge2} label="Registration number" value={registrationNumber || "Not set"} /></>}{!isStudent && <ProfileSummary icon={Building2} label="Working fields" value={staffWorkingFields.join(", ") || "Not set"} />}<ProfileSummary icon={ShieldCheck} label="Profile status" value="Active" /></div><div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-blue-100">For account sign-in or administrative access, use your authenticated CampusFix account. This page changes only your student profile details.</div></aside>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(14,54,114,0.06)] sm:p-7"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><PencilLine className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">Edit your details</h2><p className="mt-1 text-sm text-slate-500">Changes are saved securely to your CampusFix profile.</p></div></div><div className="mt-7 grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" value={name} onChange={event => setName(event.target.value)} placeholder="Your full name" /></div><div className="space-y-2"><Label>Email address</Label><Input value={user.email ?? ""} disabled /></div><div className="space-y-2"><Label>Hostel or residence</Label><Select value={isCampusHostel(hostel) ? hostel : ""} onValueChange={setHostel}><SelectTrigger aria-label="Hostel or residence"><SelectValue placeholder="Select your hostel" /></SelectTrigger><SelectContent>{hostelOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Campus role</Label><Input value={role === "staff" ? "Staff" : "Student"} disabled /></div>{isStudent && <><div className="space-y-2"><Label htmlFor="profile-roll-number">Roll number <span className="text-rose-600">*</span></Label><Input id="profile-roll-number" value={rollNumber} onChange={event => setRollNumber(event.target.value)} placeholder="e.g. 24CSE101" required /></div><div className="space-y-2"><Label htmlFor="profile-registration-number">Registration number <span className="text-rose-600">*</span></Label><Input id="profile-registration-number" value={registrationNumber} onChange={event => setRegistrationNumber(event.target.value)} placeholder="e.g. REG/2026/001" required /></div></>}<div className="space-y-2"><Label>Gender</Label><Select value={gender} onValueChange={value => { setGender(value as Gender); if (value === "Female") setMobileNumber(""); }}><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent><SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem><SelectItem value="Non-binary">Non-binary</SelectItem><SelectItem value="Prefer not to say">Prefer not to say</SelectItem></SelectContent></Select></div><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="profile-mobile">Mobile number {mobileRequired && <span className="text-rose-600">*</span>}</Label>{gender === "Female" && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">Optional</span>}</div><Input id="profile-mobile" type="tel" inputMode="tel" value={mobileNumber} onChange={event => setMobileNumber(event.target.value)} placeholder="e.g. +91 98765 43210" disabled={gender === "Female"} required={mobileRequired} /><p className="text-xs leading-relaxed text-slate-500">{gender === "Female" ? "Mobile number is optional for female students." : gender ? "A mobile number helps campus teams contact you about your complaint." : "Select gender to confirm this requirement."}</p></div></div>{!isStudent && <fieldset className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><legend className="px-1 text-sm font-bold text-slate-900">Working fields <span className="text-rose-600">*</span></legend><p className="mb-3 text-xs text-slate-600">Select all complaint categories you are qualified to handle.</p><div className="grid gap-2 sm:grid-cols-2">{complaintCategoryNames.map(field => <label key={field} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={staffWorkingFields.includes(field)} onChange={() => setStaffWorkingFields(current => current.includes(field) ? current.filter(value => value !== field) : [...current, field])} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" />{field}</label>)}</div></fieldset>}<div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Button variant="outline" onClick={discardChanges} disabled={!isDirty || updateProfile.isPending} className="rounded-xl border-slate-200 bg-white font-bold">Discard changes</Button><Button onClick={saveProfile} disabled={!isDirty || updateProfile.isPending} className="rounded-xl bg-[#0b57d0] font-bold hover:bg-[#0848af]">{updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save profile</Button></div></section>
    </div>
  </div></DashboardLayout>;
}

function ProfileSummary({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) { return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#ffd43b]" /><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">{label}</p><p className="mt-1 break-words text-sm font-semibold text-white">{value}</p></div></div>; }
function LoadingProfile() { return <div className="grid min-h-[55vh] place-items-center"><div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-700" /><p className="mt-3 text-sm font-semibold text-slate-600">Loading your profile…</p></div></div>; }
function MissingProfile({ onRegister }: { onRegister: () => void }) { return <div className="grid min-h-[55vh] place-items-center text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><UserRound className="h-7 w-7" /></span><h1 className="mt-5 text-2xl font-extrabold text-slate-950">Complete your registration first</h1><p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">Register once to create a student profile you can manage from this page.</p><Button onClick={onRegister} className="mt-5 rounded-xl bg-[#0b57d0] font-bold hover:bg-[#0848af]">Start registration</Button></div></div>; }
