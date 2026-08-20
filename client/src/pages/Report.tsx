import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PriorityPill } from "@/components/ComplaintBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { complaintCategories } from "@/lib/complaintCategories";
import { hostelOptions, isCampusHostel } from "@/lib/hostelOptions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, FileText, ImagePlus, Lightbulb, Loader2, MapPin, Paperclip, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Analysis = { departmentCategory: string; priorityLevel: "Low" | "Medium" | "High"; aiSummary: string };
type Uploaded = { id: number; fileName: string; kind: "photo" | "application" };

function fileAsBase64(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read file.")); reader.readAsDataURL(file); }); }

export default function Report() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const profile = trpc.profile.me.useQuery(undefined, { enabled: Boolean(user) });
  const [description, setDescription] = useState("");
  const [hostel, setHostel] = useState("");
  const [block, setBlock] = useState("");
  const [room, setRoom] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [application, setApplication] = useState<File | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<Uploaded | null>(null);
  const [uploadedApplication, setUploadedApplication] = useState<Uploaded | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const category = sessionStorage.getItem("campusfix-selected-category") ?? "";
    sessionStorage.removeItem("campusfix-selected-category");
    return complaintCategories.some(item => item.name === category) ? category : "";
  });
  const upload = trpc.complaints.uploadEvidence.useMutation();
  const analyze = trpc.complaints.analyze.useMutation();
  const submit = trpc.complaints.submit.useMutation();
  const busy = upload.isPending || analyze.isPending || submit.isPending;
  const attachmentIds = [uploadedPhoto?.id, uploadedApplication?.id].filter((id): id is number => Boolean(id));

  useEffect(() => {
    if (user && !profile.isLoading && !profile.isError && !profile.data) setLocation("/onboarding?next=/report");
    if (profile.data?.role === "staff" && profile.data.staffApprovalStatus !== "approved") setLocation("/staff-approval");
  }, [user, profile.data, profile.isError, profile.isLoading, setLocation]);

  const ensureUpload = async (file: File | null, existing: Uploaded | null, kind: "photo" | "application") => {
    if (!file || existing) return existing;
    const mimeType = file.type || (kind === "application" ? "application/pdf" : "image/jpeg");
    const result = await upload.mutateAsync({ kind, fileName: file.name, mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "application/pdf", base64Data: await fileAsBase64(file) });
    return { id: result.id, fileName: result.fileName, kind: result.kind } as Uploaded;
  };
  const handleAnalyze = async () => {
    if (!selectedCategory) return toast.error("Choose the complaint category that best fits this issue.");
    if (!description.trim() || !isCampusHostel(hostel) || !block.trim() || !room.trim()) return toast.error("Add the issue details and full location first.");
    try { const nextPhoto = await ensureUpload(photo, uploadedPhoto, "photo"); if (nextPhoto && !uploadedPhoto) setUploadedPhoto(nextPhoto); const nextApplication = await ensureUpload(application, uploadedApplication, "application"); if (nextApplication && !uploadedApplication) setUploadedApplication(nextApplication); const ids = [nextPhoto?.id, nextApplication?.id].filter((id): id is number => Boolean(id)); const result = await analyze.mutateAsync({ description, hostel, block, room, attachmentIds: ids, preferredCategory: selectedCategory }); setAnalysis(result); } catch (error) { toast.error(error instanceof Error ? error.message : "Analysis could not be completed."); }
  };
  const handleSubmit = async () => { if (!analysis || !isCampusHostel(hostel)) return; try { const complaint = await submit.mutateAsync({ description, hostel, block, room, attachmentIds, analysis }); toast.success("Complaint submitted successfully."); setLocation(`/confirmed/${complaint.id}`); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit complaint."); } };
  const choosePhoto = (file: File | null) => { if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Upload a JPEG, PNG, or WebP photo."); setPhoto(file); setUploadedPhoto(null); setAnalysis(null); };
  const chooseApplication = (file: File | null) => { if (file && !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Applications must be a PDF, JPEG, PNG, or WebP file."); setApplication(file); setUploadedApplication(null); setAnalysis(null); };

  if (!user || profile.isLoading) return <DashboardLayout><div className="grid min-h-[55vh] place-items-center text-center"><div><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-700" /><p className="mt-3 text-sm font-semibold text-slate-600">Checking your registration…</p></div></div></DashboardLayout>;
  if (!profile.data) return <DashboardLayout><ProfilePrompt onComplete={() => setLocation("/onboarding?next=/report")} /></DashboardLayout>;
  if (profile.data.role === "staff" && profile.data.staffApprovalStatus !== "approved") return null;
  return <DashboardLayout><div className="mx-auto max-w-5xl py-2 sm:py-5"><div className="mb-7 flex items-start gap-3"><Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")} className="mt-0.5 rounded-xl text-slate-600"><ArrowLeft className="h-5 w-5" /></Button><div><p className="text-sm font-bold text-blue-700">New report</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">What needs attention?</h1><p className="mt-2 text-sm text-slate-500">Add the details below. You will review the AI analysis before anything is submitted.</p></div></div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(14,54,114,0.06)] sm:p-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileText className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">File a complaint</h2><p className="text-sm text-slate-500">Choose a category, then explain what you observed.</p></div></div><div className="mt-6 space-y-5"><div><div className="mb-2 flex items-center justify-between"><Label>Complaint category</Label><span className="text-xs font-medium text-slate-400">Required</span></div><div className="grid gap-2 sm:grid-cols-2"><div className="contents">{complaintCategories.map(category => { const Icon = category.icon; const chosen = selectedCategory === category.name; return <button type="button" key={category.name} onClick={() => { setSelectedCategory(category.name); setAnalysis(null); }} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${chosen ? "border-blue-600 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${category.tone}`}><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-extrabold text-slate-800">{category.name}</span><span className="mt-0.5 block text-xs leading-snug text-slate-500">{category.description}</span></span></button>; })}</div></div></div><div className="space-y-2"><Label htmlFor="description">Describe the issue</Label><Textarea id="description" value={description} onChange={event => { setDescription(event.target.value); setAnalysis(null); }} placeholder="For example: The ceiling fan in Room 204 is making a loud noise and has stopped rotating." className="min-h-36 resize-y" maxLength={4000} /><p className="text-right text-xs text-slate-400">{description.length}/4000</p></div><div><div className="mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-700" /><Label>Exact location</Label></div><div className="grid gap-3 sm:grid-cols-3"><Select value={isCampusHostel(hostel) ? hostel : ""} onValueChange={value => { setHostel(value); setAnalysis(null); }}><SelectTrigger aria-label="Hostel"><SelectValue placeholder="Select hostel" /></SelectTrigger><SelectContent>{hostelOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select><Input value={block} onChange={event => { setBlock(event.target.value); setAnalysis(null); }} placeholder="Block" /><Input value={room} onChange={event => { setRoom(event.target.value); setAnalysis(null); }} placeholder="Room" /></div></div><div className="grid gap-3 sm:grid-cols-2"><EvidencePicker label="Photo of the problem" hint="Optional · JPEG, PNG, or WebP · up to 7.5 MB" icon={ImagePlus} accept="image/jpeg,image/png,image/webp" file={photo} onFile={choosePhoto} /><EvidencePicker label="Handwritten application" hint="Optional · PDF · up to 7.5 MB" icon={Paperclip} accept="application/pdf" file={application} onFile={chooseApplication} /></div></div>
      {!analysis && <Button onClick={handleAnalyze} size="lg" disabled={busy} className="mt-7 w-full rounded-xl bg-[#082962] font-bold hover:bg-[#061f4a]">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing your review…</> : <><BrainCircuit className="mr-2 h-4 w-4" /> Analyze with AI</>}</Button>}
      {analysis && <div className="mt-7 border-t border-slate-100 pt-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">Review before submission</h2><p className="text-sm text-slate-500">AI has prepared the routing details. You remain in control.</p></div></div><div className="mt-5 rounded-2xl bg-slate-50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Assigned department</p><p className="mt-1 text-lg font-extrabold text-slate-900">{analysis.departmentCategory}</p><p className="mt-1 text-xs font-semibold text-slate-500">Selected category: {selectedCategory}</p></div><PriorityPill priority={analysis.priorityLevel} /></div><div className="mt-4 border-t border-slate-200 pt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">AI summary</p><p className="mt-2 text-sm leading-relaxed text-slate-700">{analysis.aiSummary}</p></div><div className="mt-4 border-t border-slate-200 pt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Location</p><p className="mt-1 text-sm font-semibold text-slate-700">{hostel}, Block {block}, Room {room}</p></div></div><div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setAnalysis(null)} disabled={busy} className="rounded-xl border-slate-200 bg-white font-bold">Edit report</Button><Button onClick={handleSubmit} disabled={busy} className="rounded-xl bg-[#0b57d0] font-bold hover:bg-[#0848af]">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Confirm & submit <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>}
    </section><aside className="space-y-4"><div className="rounded-2xl bg-[#082962] p-6 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#ffd43b]"><Lightbulb className="h-5 w-5" /></span><h2 className="mt-5 font-extrabold">Helpful reports are specific.</h2><p className="mt-2 text-sm leading-relaxed text-blue-100">Mention what happened, where it happened, and whether there is a safety risk. Add a clear photo when it helps.</p></div><div className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><div><h2 className="font-extrabold text-blue-950">Your evidence stays linked to this ticket.</h2><p className="mt-1.5 text-sm leading-relaxed text-blue-800">Photos and documents are stored securely and used only to assess and manage the complaint.</p></div></div></div></aside></div>
  </div></DashboardLayout>;
}

function EvidencePicker({ label, hint, icon: Icon, accept, file, onFile }: { label: string; hint: string; icon: typeof ImagePlus; accept: string; file: File | null; onFile: (file: File | null) => void }) { return <label className="group cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50"><input type="file" className="sr-only" accept={accept} onChange={event => onFile(event.target.files?.[0] ?? null)} /><Icon className="h-5 w-5 text-blue-700" /><p className="mt-2 text-sm font-bold text-slate-800">{file?.name ?? label}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{file ? "Ready to include · click to replace" : hint}</p></label>; }
function ProfilePrompt({ onComplete }: { onComplete: () => void }) { return <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><ShieldCheck className="h-7 w-7" /></span><h1 className="mt-5 text-2xl font-extrabold text-slate-950">Register before filing</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">Complete your campus registration once, then CampusFix will return you directly to this complaint form.</p><Button onClick={onComplete} className="mt-5 rounded-xl bg-[#0b57d0] font-bold hover:bg-[#0848af]">Start registration <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>; }
