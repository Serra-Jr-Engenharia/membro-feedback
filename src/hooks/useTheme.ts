import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getTheme);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme((current) => {
        const next = getTheme();
        return current === next ? current : next;
      });
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
