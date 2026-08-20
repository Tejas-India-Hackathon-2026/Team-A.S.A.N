import { useAuth } from "@/_core/hooks/useAuth";
import { CampusFixBrand } from "@/components/CampusFixBrand";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { hostelOptions, isCampusHostel } from "@/lib/hostelOptions";
import { getOnboardingNextPath } from "@/lib/onboardingRoute";
import { complaintCategoryNames, type ComplaintCategoryName } from "@shared/complaintCategories";
import { ArrowRight, ImagePlus, ShieldCheck, UserRound } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";

function fileAsBase64(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read staff photo.")); reader.readAsDataURL(file); }); }

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const nextPath = getOnboardingNextPath(search);
  const [name, setName] = useState(user?.name ?? "");
  const [hostel, setHostel] = useState("");
  const [gender, setGender] = useState<string>("");
  const [role, setRole] = useState<"student" | "staff">("student");
  const [mobileNumber, setMobileNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [staffPhoto, setStaffPhoto] = useState<File | null>(null);
  const [staffWorkingFields, setStaffWorkingFields] = useState<ComplaintCategoryName[]>([]);
  const mobileRequired = role === "student" && Boolean(gender) && gender !== "Female";
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: profile => { if (profile.role === "staff" && profile.staffApprovalStatus !== "approved") { toast.success("Staff registration submitted for administrator approval."); setLocation("/staff-approval"); return; } toast.success("Registration complete. Your complaint desk is ready."); setLocation(nextPath); },
    onError: error => toast.error(error.message),
  });

  return <DashboardLayout><div className="mx-auto max-w-5xl py-6 sm:py-10">
    <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_24px_70px_rgba(18,52,98,0.09)]">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative overflow-hidden bg-[#082962] p-7 text-white sm:p-10">
          <div className="absolute -right-16 -top-14 h-48 w-48 rounded-full border-[32px] border-blue-400/20" />
          <CampusFixBrand className="relative [&_span:nth-child(2)_.block:first-child]:text-white [&_span:nth-child(2)_.block:last-child]:text-blue-200" />
          <div className="relative mt-16 max-w-sm"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100"><ShieldCheck className="h-3.5 w-3.5" /> First-time registration</span><h1 className="mt-5 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Register once. Raise complaints anytime.</h1><p className="mt-4 leading-relaxed text-blue-100">A few details help CampusFix route reports clearly and keep the right people informed.</p></div>
          <div className="relative mt-14 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-100">Your account is protected through Manus OAuth. CampusFix only requests profile details needed for complaint reporting and tracking.</div>
        </aside>
        <section className="p-7 sm:p-10"><div className="mb-8"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><UserRound className="h-5 w-5" /></span><h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">Complete your registration</h2><p className="mt-1 text-sm text-slate-500">Once saved, you will return straight to the complaint form.</p></div>
          <form onSubmit={async event => { event.preventDefault(); if (!isCampusHostel(hostel)) return toast.error("Please select your hostel."); if (!gender) return toast.error("Please select your gender."); if (role === "student" && !rollNumber.trim()) return toast.error("Please add your roll number."); if (role === "student" && !registrationNumber.trim()) return toast.error("Please add your registration number."); if (role === "staff" && !staffPhoto) return toast.error("Please upload your staff photo for approval."); if (role === "staff" && staffWorkingFields.length === 0) return toast.error("Please select at least one working field."); if (mobileRequired && !mobileNumber.trim()) return toast.error("Please add your mobile number."); try { updateProfile.mutate({ name, hostel, gender: gender as "Female" | "Male" | "Non-binary" | "Prefer not to say", role, mobileNumber: mobileNumber.trim() || null, rollNumber: rollNumber.trim() || null, registrationNumber: registrationNumber.trim() || null, staffWorkingFields: role === "staff" ? staffWorkingFields : [], staffPhoto: role === "staff" ? { fileName: staffPhoto!.name, mimeType: staffPhoto!.type as "image/jpeg" | "image/png" | "image/webp", base64Data: await fileAsBase64(staffPhoto!) } : undefined }); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not prepare the staff photo."); } }} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your full name" required /></div><div className="space-y-2"><Label>Email address</Label><Input value={user?.email ?? ""} disabled /></div></div>
            <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label>Campus role</Label><Select value={role} onValueChange={value => setRole(value as "student" | "staff")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Hostel or residence</Label><Select value={isCampusHostel(hostel) ? hostel : ""} onValueChange={setHostel}><SelectTrigger aria-label="Hostel or residence"><SelectValue placeholder="Select your hostel" /></SelectTrigger><SelectContent>{hostelOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div></div>
            {role === "student" && <div className="grid gap-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="rollNumber">Roll number <span className="text-rose-600">*</span></Label><Input id="rollNumber" value={rollNumber} onChange={event => setRollNumber(event.target.value)} placeholder="e.g. 24CSE101" required /></div><div className="space-y-2"><Label htmlFor="registrationNumber">Registration number <span className="text-rose-600">*</span></Label><Input id="registrationNumber" value={registrationNumber} onChange={event => setRegistrationNumber(event.target.value)} placeholder="e.g. REG/2026/001" required /></div></div>}
            {role === "staff" && <><div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700"><ImagePlus className="h-5 w-5" /></span><div><Label htmlFor="staffPhoto" className="font-bold text-slate-800">Staff photo <span className="text-rose-600">*</span></Label><p className="mt-1 text-xs leading-relaxed text-slate-600">A clear JPEG, PNG, or WebP photo is required for administrator approval. It is visible only to administrators reviewing your registration.</p><Input id="staffPhoto" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => { const file = event.target.files?.[0] ?? null; if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Use a JPEG, PNG, or WebP staff photo."); event.target.value = ""; return; } setStaffPhoto(file); }} className="mt-3 cursor-pointer bg-white" />{staffPhoto && <p className="mt-2 text-xs font-semibold text-blue-700">Ready to upload: {staffPhoto.name}</p>}</div></div></div><fieldset className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><legend className="px-1 text-sm font-bold text-slate-900">Working fields <span className="text-rose-600">*</span></legend><p className="mb-3 text-xs leading-relaxed text-slate-600">Select every service area you are qualified to handle. You can choose more than one.</p><div className="grid gap-2 sm:grid-cols-2">{complaintCategoryNames.map(field => <label key={field} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300"><input type="checkbox" checked={staffWorkingFields.includes(field)} onChange={() => setStaffWorkingFields(current => current.includes(field) ? current.filter(value => value !== field) : [...current, field])} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" />{field}</label>)}</div></fieldset></>}
            <div className="space-y-2"><Label>Gender</Label><Select value={gender} onValueChange={value => { setGender(value); if (value === "Female") setMobileNumber(""); }}><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent><SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem><SelectItem value="Non-binary">Non-binary</SelectItem><SelectItem value="Prefer not to say">Prefer not to say</SelectItem></SelectContent></Select></div>
            {role === "student" && <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="flex items-center justify-between gap-3"><Label htmlFor="mobileNumber">Mobile number {mobileRequired && <span className="text-rose-600">*</span>}</Label>{gender === "Female" && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Not required</span>}</div><Input id="mobileNumber" type="tel" inputMode="tel" value={mobileNumber} onChange={event => setMobileNumber(event.target.value)} placeholder="e.g. +91 98765 43210" required={mobileRequired} disabled={gender === "Female"} /><p className="text-xs leading-relaxed text-slate-500">{gender === "Female" ? "Mobile number is optional for female students." : gender ? "A mobile number helps the campus team reach you about your complaint when needed." : "Select your gender to confirm the contact requirement."}</p></div>}
            <Button type="submit" size="lg" disabled={updateProfile.isPending} className="mt-3 w-full bg-[#0b57d0] font-bold hover:bg-[#0848af]">{updateProfile.isPending ? "Saving your profile…" : <>Continue to CampusFix <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
          </form>
        </section>
      </div>
    </div>
  </div></DashboardLayout>;
}
