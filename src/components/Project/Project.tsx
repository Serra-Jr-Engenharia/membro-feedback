import Card from "./Card";
import StatusBadge from "../ui/StatusBadge";

interface ProjectProps {
  nome?: string;
  descricao?: string;
  membros: string[];
  evaluate: (value: string | null) => void;
  onEditTitle?: () => void;
  getMemberStatus?: (memberName: string) => "evaluated" | "draft" | "pending";
}

export default function Project({
  nome,
  descricao,
  membros,
  evaluate,
  onEditTitle,
  getMemberStatus,
}: ProjectProps) {
  const total = membros.length;
  const drafts = getMemberStatus
    ? membros.filter((membro) => getMemberStatus(membro) === "draft").length
    : 0;

  return (
    <div className="flex w-full animate-fade-in flex-col gap-5 font-poppins text-white">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {nome || "Equipe"}
            </h2>
            {onEditTitle && (
              <button
                type="button"
                onClick={onEditTitle}
                className="cursor-pointer text-xs font-medium text-cyan-400 underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
              >
                Editar nome
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="neutral">
              {total} {total === 1 ? "pessoa" : "pessoas"}
            </StatusBadge>
            {drafts > 0 && (
              <StatusBadge tone="info">{drafts} com rascunho salvo</StatusBadge>
            )}
          </div>
        </div>

        {descricao && (
          <p className="max-w-2xl text-sm text-gray-400">{descricao}</p>
        )}
      </div>

      {total > 0 ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {membros.map((membroNome) => (
            <Card
              key={membroNome}
              nome={membroNome}
              evaluate={() => evaluate(membroNome)}
              status={getMemberStatus ? getMemberStatus(membroNome) : "pending"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center">
          <p className="text-sm text-gray-400">
            Ninguém para avaliar nesta seção.
          </p>
        </div>
      )}
    </div>
  );
}
