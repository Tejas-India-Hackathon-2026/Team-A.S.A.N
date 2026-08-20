import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { formatDate } from "./ComplaintBadges";
import { useLocation } from "wouter";

export function NotificationMenu() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const notifications = trpc.notifications.list.useQuery(undefined, { refetchInterval: 15_000 });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });
  const unread = notifications.data?.filter(item => !item.readAt).length ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-800" aria-label="Open notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(360px,calc(100vw-2rem))] rounded-2xl border-slate-100 p-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <div><p className="font-bold text-slate-950">Notifications</p><p className="text-xs text-slate-500">Updates on your CampusFix tickets</p></div>
          {unread > 0 && <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{unread} new</span>}
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {notifications.isLoading && <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-blue-700" /></div>}
          {!notifications.isLoading && !notifications.data?.length && <p className="px-3 py-8 text-center text-sm text-slate-500">You are all caught up.</p>}
          {notifications.data?.map(item => (
            <button key={item.id} type="button" onClick={() => { if (!item.readAt) markRead.mutate({ notificationId: item.id }); if (item.complaintId) setLocation(`/ticket/${item.complaintId}`); }} className={`w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50 ${item.readAt ? "opacity-70" : "bg-blue-50/60"}`}>
              <div className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-slate-300" : "bg-blue-600"}`} /><div className="min-w-0"><p className="text-sm font-bold text-slate-800">{item.title}</p><p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.message}</p><p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-slate-400">{item.readAt && <CheckCheck className="h-3 w-3" />}{formatDate(item.createdAt)}</p></div></div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
