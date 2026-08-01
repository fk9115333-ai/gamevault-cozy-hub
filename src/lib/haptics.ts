export const buzz = (pattern: number | number[] = 50) => {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
};
