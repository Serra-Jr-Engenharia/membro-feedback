import type { EvaluationFormData } from './EvaluationModal';
import type { SelfEvaluationFormData } from './SelfEvaluationModal';

type ReviewItem = {
  nome: string;
  data: EvaluationFormData;
  evaluationType: 'member' | 'director';
};

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: ReviewItem[];
  selfEvaluation?: {
    data: SelfEvaluationFormData;
    periodLabel?: string;
  } | null;
  title?: string;
};

type CardEvaluationProps = {
  campos: (string | number | undefined)[];
  isHeader?: boolean;
};

function calcMedia(nums: Array<number | undefined>) {
  const notas = nums.filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
  if (notas.length === 0) return '-';
  const media = notas.reduce((acc, n) => acc + n, 0) / notas.length;
  return media.toFixed(1);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function SelfEvaluationReview({
  data,
  periodLabel,
}: {
  data: SelfEvaluationFormData;
  periodLabel?: string;
}) {
  const ratings = [
    { label: 'Rendimento', value: data.rating_rendimento },
    { label: 'Entregas', value: data.rating_entregas },
    { label: 'Consistência', value: data.rating_consistencia },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-poppins font-semibold text-white">Autoavaliação</h4>
        {periodLabel && (
          <span className="text-xs text-brand-200">{periodLabel}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ratings.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-azulEscuroCard px-4 py-3"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-200">
              {label}
            </span>
            <p className="font-display text-2xl font-bold text-white">
              {value}/5
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">
            O que poderia ter sido melhor?
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">
            {data.rating_melhoria || 'Não informado.'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">
            O que ajudou ou atrapalhou?
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">
            {data.rating_fatores || 'Não informado.'}
          </p>
        </div>
      </div>

      {data.comments && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">
            Comentários adicionais
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">
            {data.comments}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ReviewModal({ isOpen, onClose, items, selfEvaluation, title }: ReviewModalProps) {
  if (!isOpen) return null;

  function CardEvaluation({ campos, isHeader = false }: CardEvaluationProps) {
    const containerClass = isHeader
      ? 'w-full h-[50px] rounded-xl bg-white/5'
      : 'w-full h-[50px] rounded-xl bg-azulEscuroCard border border-white/10';

    const textClass = isHeader
      ? 'font-poppins font-semibold text-[14px] uppercase tracking-wider text-cyan-400'
      : 'font-poppins font-medium text-white';

    const gridClass =
      'grid h-full items-center ' +
      '[grid-template-columns:minmax(220px,2fr)_repeat(6,minmax(110px,1fr))]';

    const cellBase =
      'px-2 flex items-center justify-center min-w-0 overflow-hidden';

    return (
      <div className={containerClass}>
        <div className={gridClass}>
          {/* Membro */}
          <div
            className={`${cellBase} ${
              !isHeader ? 'border-r border-white/10 justify-start' : ''
            }`}
          >
            {isHeader ? (
              <p className={`${textClass} truncate`}>{campos[0] ?? '-'}</p>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-800 text-[10px] font-semibold text-cyan-400">
                  {getInitials(String(campos[0] ?? ''))}
                </div>
                <p className={`${textClass} truncate`}>{campos[0] ?? '-'}</p>
              </div>
            )}
          </div>

          {/* Coluna 1 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-white/10' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[1] ?? '-'}</p>
          </div>

          {/* Coluna 2 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-white/10' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[2] ?? '-'}</p>
          </div>

          {/* Coluna 3 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-white/10' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[3] ?? '-'}</p>
          </div>

          {/* Coluna 4 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-white/10' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[4] ?? '-'}</p>
          </div>

          {/* Coluna 5 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-white/10' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[5] ?? '-'}</p>
          </div>

          {/* Média */}
          <div className={cellBase}>
            <p className={`${textClass} truncate`}>{campos[6] ?? '-'}</p>
          </div>
        </div>
      </div>
    );
  }

  const headerMember = ['Membro', 'Comunicação', 'Participação', 'Rel. Grupo', 'Proatividade', 'Metas', 'Média'];
  const headerDirector = ['Membro', 'Comunicação', 'Liderança', 'Proatividade', 'Flexibilidade', 'Delegação', 'Média'];

  const members = items.filter(i => i.evaluationType === 'member');
  const directors = items.filter(i => i.evaluationType === 'director');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar modal"
      />

      <div className="relative w-[92%] max-w-6xl rounded-2xl bg-azulEscuroPage border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-poppins text-white text-xl font-semibold">
            {title || 'Resumo das avaliações pendentes'}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors text-2xl leading-none cursor-pointer"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          {items.length === 0 && !selfEvaluation ? (
            <p className="text-gray-400 font-poppins">
              Nenhuma avaliação pendente para revisar.
            </p>
          ) : (
            <div className="w-full overflow-x-auto no-scrollbar">
              <div className="max-h-[65vh] overflow-y-auto pb-6 pr-3">
                <div className="flex flex-col gap-8">
                  {items.length > 0 && (
                    <div className="flex min-w-[920px] flex-col gap-8">
                      {/* BLOCO: MEMBROS */}
                      {members.length > 0 && (
                        <div className="flex flex-col gap-[15px]">
                          <CardEvaluation isHeader campos={headerMember} />

                          {members.map((it) => (
                            <CardEvaluation
                              key={`m-${it.nome}`}
                              campos={[
                                it.nome,
                                it.data.rating_comunicacao,
                                it.data.rating_participacao,
                                it.data.rating_relacao_grupo,
                                it.data.rating_proatividade,
                                it.data.rating_entrega_metas,
                                calcMedia([
                                  it.data.rating_comunicacao,
                                  it.data.rating_participacao,
                                  it.data.rating_relacao_grupo,
                                  it.data.rating_proatividade,
                                  it.data.rating_entrega_metas,
                                ]),
                              ]}
                            />
                          ))}
                        </div>
                      )}

                      {/* BLOCO: LÍDERES */}
                      {directors.length > 0 && (
                        <div className="flex flex-col gap-[15px]">
                          <p className="text-cyan-400 font-poppins font-semibold">
                            Avaliações de Liderança
                          </p>

                          <CardEvaluation isHeader campos={headerDirector} />

                          {directors.map((it) => (
                            <CardEvaluation
                              key={`d-${it.nome}`}
                              campos={[
                                it.nome,
                                it.data.rating_comunicacao,
                                it.data.rating_lideranca,
                                it.data.rating_proatividade,
                                it.data.rating_flexibilidade,
                                it.data.text_delegacao,
                                calcMedia([
                                  it.data.rating_comunicacao,
                                  it.data.rating_lideranca,
                                  it.data.rating_proatividade,
                                  it.data.rating_flexibilidade,
                                ]),
                              ]}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selfEvaluation && (
                    <SelfEvaluationReview
                      data={selfEvaluation.data}
                      periodLabel={selfEvaluation.periodLabel}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
