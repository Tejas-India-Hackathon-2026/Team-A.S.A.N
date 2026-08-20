import type { LucideIcon } from "lucide-react";
import { Armchair, Bug, Cable, Droplets, Leaf, MonitorCog, ShieldCheck, Sparkles, Trash2, Wifi, Wrench, Zap } from "lucide-react";

export type ComplaintCategory = {
  name: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

export const complaintCategories: ComplaintCategory[] = [
  { name: "Electrical", description: "Lights, fans, switches, or power", icon: Zap, tone: "bg-amber-50 text-amber-700" },
  { name: "Plumbing", description: "Leaks, taps, drains, or bathrooms", icon: Droplets, tone: "bg-sky-50 text-sky-700" },
  { name: "Housekeeping", description: "Cleaning and shared-area upkeep", icon: Sparkles, tone: "bg-violet-50 text-violet-700" },
  { name: "Civil Maintenance", description: "Walls, doors, flooring, or repairs", icon: Wrench, tone: "bg-orange-50 text-orange-700" },
  { name: "IT Services", description: "Campus systems and computer support", icon: MonitorCog, tone: "bg-blue-50 text-blue-700" },
  { name: "Security", description: "Access, safety, or security concerns", icon: ShieldCheck, tone: "bg-rose-50 text-rose-700" },
  { name: "Internet & Wi-Fi", description: "Connectivity and network access", icon: Wifi, tone: "bg-cyan-50 text-cyan-700" },
  { name: "Furniture & Fixtures", description: "Beds, desks, cupboards, or fittings", icon: Armchair, tone: "bg-stone-50 text-stone-700" },
  { name: "Water Supply", description: "Water availability and quality", icon: Cable, tone: "bg-teal-50 text-teal-700" },
  { name: "Pest Control", description: "Insects, rodents, or infestations", icon: Bug, tone: "bg-lime-50 text-lime-700" },
  { name: "Waste Management", description: "Bins, collection, and disposal", icon: Trash2, tone: "bg-fuchsia-50 text-fuchsia-700" },
  { name: "Grounds & Facilities", description: "Outdoor areas and common facilities", icon: Leaf, tone: "bg-emerald-50 text-emerald-700" },
];

export const complaintCategoryNames = complaintCategories.map(category => category.name);
