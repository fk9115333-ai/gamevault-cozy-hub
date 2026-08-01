import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { SectionTitle } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات والنسخ الاحتياطي — GameHub" },
      { name: "description", content: "تصدير واستيراد بياناتك محليًا وإدارة التذكيرات." },
      { property: "og:title", content: "الإعدادات — GameHub" },
      { property: "og:description", content: "نسخ احتياطي محلي وجاهزية للمزامنة السحابية." },
    ],
  }),
  component: SettingsPage,
});

const reminders = [
  "قبل 30 يومًا من الإصدار",
  "قبل 7 أيام",
  "قبل يوم واحد",
  "يوم الإصدار",
  "عند إنهاء لعبة",
  "عند فتح إنجاز",
  "عند إكمال هدف",
];

function SettingsPage() {
  const users = useStore((s) => s.users);
  const importData = useStore((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(reminders.map((r) => [r, true])),
  );

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ users }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gamehub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير النسخة الاحتياطية");
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    if (importData(text)) toast.success("تم الاستيراد بنجاح");
    else toast.error("ملف غير صالح");
  };

  return (
    <div className="space-y-8">
      <SectionTitle title="الإعدادات" subtitle="نسخ احتياطي محلي وتذكيرات" />

      <section className="rounded-3xl border border-border bg-card p-6">
        <h3 className="mb-1 font-display font-bold">النسخ الاحتياطي</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          البيانات محفوظة تلقائيًا في متصفحك، والبنية جاهزة للمزامنة السحابية لاحقًا.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJson} className="rounded-xl">
            <Download className="size-4" /> تصدير JSON
          </Button>
          <Button variant="secondary" className="rounded-xl" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> استيراد JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display font-bold">التذكيرات</h3>
        <div className="space-y-3">
          {reminders.map((r) => (
            <div key={r} className="flex items-center justify-between rounded-2xl bg-secondary/40 px-4 py-3">
              <Label className="text-sm">{r}</Label>
              <Switch
                checked={on[r] ?? true}
                onCheckedChange={(v) => setOn((prev) => ({ ...prev, [r]: v }))}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
