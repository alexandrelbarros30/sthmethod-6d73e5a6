/** Rola até um campo e destaca visualmente por alguns segundos. */
export function focusField(id: string, attempts = 12) {
  const tryFocus = (left: number) => {
    const el = document.getElementById(id);
    if (!el) {
      if (left > 0) setTimeout(() => tryFocus(left - 1), 120);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-destructive", "ring-offset-2", "rounded-lg", "transition-all");
    const input = el.querySelector<HTMLElement>("input, textarea, button, [role='combobox']");
    setTimeout(() => input?.focus({ preventScroll: true }), 400);
    setTimeout(() => el.classList.remove("ring-2", "ring-destructive", "ring-offset-2"), 3000);
  };
  setTimeout(() => tryFocus(attempts), 60);
}
