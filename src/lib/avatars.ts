import outlaw from "@/assets/avatars/outlaw.jpg";
import warrior from "@/assets/avatars/warrior.jpg";
import survivor from "@/assets/avatars/survivor.jpg";
import veteran from "@/assets/avatars/veteran.jpg";
import rookie from "@/assets/avatars/rookie.jpg";
import ninja from "@/assets/avatars/ninja.jpg";

export type AvatarOption = { id: string; label: string; src: string };

/** معرض الشخصيات — بنمط بلايستيشن */
export const AVATARS: AvatarOption[] = [
  { id: "outlaw", label: "الخارج عن القانون", src: outlaw },
  { id: "warrior", label: "المحارب", src: warrior },
  { id: "survivor", label: "الناجية", src: survivor },
  { id: "veteran", label: "المخضرم", src: veteran },
  { id: "rookie", label: "الشرطي المبتدئ", src: rookie },
  { id: "ninja", label: "النينجا", src: ninja },
];

/** يرجّع رابط صورة الشخصية إن كانت القيمة معرّف شخصية، وإلا null (إيموجي قديم) */
const legacy: Record<string, string> = { "🎮": "outlaw", "🕹️": "ninja" };

export const avatarSrc = (value: string): string | null => {
  const id = legacy[value] ?? value;
  return AVATARS.find((a) => a.id === id)?.src ?? null;
};

export const defaultAvatar: Record<string, string> = {
  faisal: "outlaw",
  mishal: "ninja",
};
