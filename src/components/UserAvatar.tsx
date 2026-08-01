import { avatarSrc } from "@/lib/avatars";
import { cn } from "@/lib/utils";

/** صورة الشخصية بإطار ذهبي VIP */
export function UserAvatar({
  value,
  size = 48,
  className,
  framed = true,
}: {
  value: string;
  size?: number;
  className?: string;
  framed?: boolean;
}) {
  const src = avatarSrc(value);
  const style = { width: size, height: size } as const;
  const frame = framed ? "border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "";

  return (
    <img
      src={src}
      alt="الشخصية"
      loading="lazy"
      width={size}
      height={size}
      style={style}
      className={cn("shrink-0 rounded-full object-cover", frame, className)}
    />
  );
}
