import ThemedLogo from "./ui/ThemedLogo";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  nome: string;
  pfp?: string;
  logout: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Header({ nome, pfp, logout }: HeaderProps) {
  return (
    <header className="flex h-[72px] w-full items-center justify-between gap-3 bg-azulEscuroPage px-4 font-poppins text-white sm:h-[90px] sm:px-6">
      <ThemedLogo
        alt="Logo Serra Jr."
        className="w-24 shrink-0 sm:w-[228px]"
      />

      <h1 className="hidden truncate text-center font-poppins text-lg font-bold uppercase tracking-[0.08em] sm:block sm:text-3xl">
        Painel de Feedback
      </h1>

      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3 sm:min-w-[200px]">
        <div className="flex flex-col items-end gap-1">
          <h3 className="text-right text-sm font-medium">{nome}</h3>
          <button
            onClick={logout}
            className="cursor-pointer text-xs font-normal transition-colors hover:text-accent-500"
          >
            Sair
          </button>
        </div>

        {pfp ? (
          <img
            src={pfp}
            alt={nome}
            className="h-10 w-10 rounded-full border border-white/10 object-cover sm:h-11 sm:w-11"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-800 text-sm font-semibold text-cyan-400 sm:h-11 sm:w-11">
            {getInitials(nome)}
          </div>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
