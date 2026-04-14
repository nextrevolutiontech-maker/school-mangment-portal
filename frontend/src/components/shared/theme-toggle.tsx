import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === "light";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
