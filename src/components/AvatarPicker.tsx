import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { UserAvatar } from "./UserAvatar";
import { useStore } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Camera, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** يقصّ المساحة المختارة من الصورة ويصدّرها مربعة */
async function cropToDataUrl(src: string, area: Area, size = 400): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** رفع صورة شخصية مع أداة قص دائرية (سحب + تكبير) */
export function AvatarPicker({ size = 80 }: { size?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const current = useStore((s) => s.users[s.currentUser].profile.avatar);
  const updateProfile = useStore((s) => s.updateProfile);

  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const pick = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("اختر ملف صورة");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const saveCrop = async () => {
    if (!src || !area) return;
    setBusy(true);
    try {
      updateProfile({ avatar: await cropToDataUrl(src, area) });
      buzz(30);
      toast.success("تم تحديث صورتك");
      setSrc(null);
    } catch {
      toast.error("تعذّر قص الصورة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="تغيير صورتك"
        onClick={() => inputRef.current?.click()}
        className="relative transition-transform active:scale-95"
      >
        <UserAvatar value={current} size={size} />
        <span className="absolute bottom-0 left-0 grid size-7 place-items-center rounded-full border border-border bg-card">
          <Camera className="size-3.5 text-primary" />
        </span>
      </button>
      <span className="text-[11px] text-muted-foreground">غيّر صورتك</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Dialog open={!!src} onOpenChange={(o) => !o && setSrc(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right font-display">قص صورتك</DialogTitle>
          </DialogHeader>

          <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-secondary">
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <ZoomIn className="size-4 shrink-0 text-primary" />
            <Slider
              dir="ltr"
              value={[zoom]}
              min={1}
              max={4}
              step={0.05}
              onValueChange={(v) => setZoom(v[0] ?? 1)}
            />
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            اسحب الصورة لتحريكها واستخدم الشريط للتكبير
          </p>

          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => void saveCrop()}>
              {busy ? "جارٍ الحفظ…" : "قص وحفظ"}
            </Button>
            <Button variant="secondary" onClick={() => setSrc(null)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
