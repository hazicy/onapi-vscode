import type { HotkeyCallback } from "react-hotkeys-hook";
export type HotkeysEvent = Parameters<HotkeyCallback>[1];

const areShortcutsEqual = (shortcut: string, shortcutsArray: string[]) => {
  // Normalize a single shortcut string
  const normalizeShortcut = (str: string) => {
    return str
      .split("+")
      .map((key) => key.trim().toLowerCase())
      .sort()
      .join("+");
  };

  // Normalize the input string shortcut
  const normalizedShortcut = normalizeShortcut(shortcut);

  // Check if an equal normalized shortcut exists in the array
  return shortcutsArray.some((arrayShortcut) => {
    return normalizeShortcut(arrayShortcut) === normalizedShortcut;
  });
};

export const handleHotKeysEventAction = (
  hotkeysEvent: HotkeysEvent,
  hotKeysMap: { [x: string]: string[] },
) => {
  // The callback already identifies the matched registration. Extra event fields
  // (scopes, descriptions, metadata) are not keyboard modifiers.
  return (
    Object.entries(hotKeysMap).find(([, shortcuts]) =>
      areShortcutsEqual(hotkeysEvent.hotkey, shortcuts),
    )?.[0] ?? "unknown"
  );
};
