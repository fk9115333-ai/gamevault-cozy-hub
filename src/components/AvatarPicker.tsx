import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AVATARS } from "@/lib/avatars";
import { UserAvatar } from "./UserAvatar";
import { useStore } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/** معرض الشخصيات — يفتح كورقة سفلية عند الضغط على الصورة */
export function AvatarPicker({ size = 80 }: { size?: number }) {
  const [open, setOpen] = useState(false);
  const current = useStore((s) => s.users[s.currentUser].profile.avatar);
  const updateProfile = useStore((s) => s.updateProfile);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label="اختر شخصيتك" className="transition-transform active:scale-95">
          <UserAvatar value={current} size={size} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" dir="rtl" className="rounded-t-3xl border-border pb-8">
        <SheetHeader>
          <SheetTitle className="text-right font-display">اختر شخصيتك</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-5 p-4">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                buzz(30);
                updateProfile({ avatar: a.id });
                setOpen(false);
              }}
              className="flex flex-col items-center gap-2"
            >
              <img
                src={a.src}
                alt={a.label}
                loading="lazy"
                width={96}
                height={96}
                className={cn(
                  "size-20 rounded-full object-cover transition-all",
                  current === a.id
                    ? "border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                    : "border border-border opacity-80",
                )}
              />
              <span className="text-[11px] text-muted-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
