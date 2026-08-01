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
/** يرجّع صورة الشخصية؛ القيم القديمة (إيموجي) تُحوَّل لشخصية ثابتة */
export const avatarSrc = (value: string): string => {
  const legacy: Record<string, string> = { "\u{1F3AE}": "outlaw", "\u{1F579}": "ninja", "\u{1F579}\u{FE0F}": "ninja" };
  const found = AVATARS.find((a) => a.id === (legacy[value] ?? value));
  if (found) return found.src;
  let h = 0;
  for (const ch of value ?? "") h = (h * 31 + ch.codePointAt(0)!) % 997;
  return AVATARS[h % AVATARS.length]!.src;
};

export const defaultAvatar: Record<string, string> = {
  faisal: "outlaw",
  mishal: "ninja",
};
