import ActionButton from "../ui/ActionButton";
import StatusBadge from "../ui/StatusBadge";

interface UserProps {
  nome: string;
  pfp?: string;
  evaluate: () => void;
  status?: "evaluated" | "draft" | "pending";
}

const statusContent = {
  evaluated: {
    tone: "success" as const,
    label: "Concluída",
    hint: "Avaliação enviada",
    action: "Reavaliar",
  },
  draft: {
    tone: "info" as const,
    label: "Rascunho salvo",
    hint: "",
    action: "Continuar",
  },
  pending: {
    tone: "warning" as const,
    label: "Pendente",
    hint: "Aguardando avaliação",
    action: "Avaliar",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Card({ nome, pfp, evaluate, status = "pending" }: UserProps) {
  const content = statusContent[status];

  return (
    <div className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-cyan-500/40 hover:bg-white/[0.07]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-brand-800 text-sm font-semibold text-cyan-400">
        {pfp ? (
          <img src={pfp} alt="" className="h-full w-full object-cover" />
        ) : (
          getInitials(nome)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{nome}</p>
        {content.hint && (
          <p className="mt-0.5 text-xs text-gray-400">{content.hint}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden sm:inline-flex">
          <StatusBadge tone={content.tone}>{content.label}</StatusBadge>
        </span>
        <ActionButton
          variant={status === "evaluated" ? "secondary" : "primary"}
          fullWidth={false}
          onClick={evaluate}
        >
          {content.action}
        </ActionButton>
      </div>
    </div>
  );
}
