import { useRef, useState } from "react";
import { UserAvatar } from "./UserAvatar";
import { useStore } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Camera } from "lucide-react";

/** يقص الصورة مربعًا ويصغّرها قبل الحفظ */
async function toSquareDataUrl(file: File, size = 320): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** رفع صورة شخصية من الجهاز — بإطار ذهبي VIP */
export function AvatarPicker({ size = 80 }: { size?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const current = useStore((s) => s.users[s.currentUser].profile.avatar);
  const updateProfile = useStore((s) => s.updateProfile);

  const pick = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("اختر ملف صورة");
      return;
    }
    setBusy(true);
    try {
      updateProfile({ avatar: await toSquareDataUrl(file) });
      buzz(30);
      toast.success("تم تحديث صورتك");
    } catch {
      toast.error("تعذّر قراءة الصورة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="تغيير صورتك"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="relative transition-transform active:scale-95 disabled:opacity-60"
      >
        <UserAvatar value={current} size={size} />
        <span className="absolute bottom-0 left-0 grid size-7 place-items-center rounded-full border border-border bg-card">
          <Camera className="size-3.5 text-primary" />
        </span>
      </button>
      <span className="text-[11px] text-muted-foreground">{busy ? "جارٍ الحفظ…" : "غيّر صورتك"}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
