import logoDark from "../../assets/LogoSerra.svg";
import logoLight from "../../assets/LogoSerraLight.svg";
import { useTheme } from "../../hooks/useTheme";

interface ThemedLogoProps {
  className?: string;
  alt?: string;
}

export default function ThemedLogo({
  className = "",
  alt = "Logo Serra Jr.",
}: ThemedLogoProps) {
  const theme = useTheme();

  return (
    <img
      src={theme === "dark" ? logoDark : logoLight}
      alt={alt}
      className={`h-auto ${className}`}
    />
  );
}
