import userIcon from '../assets/userIcon.svg'
import type { EvaluationFormData } from './EvaluationModal';

type ReviewItem = {
  nome: string;
  data: EvaluationFormData;
  evaluationType: 'member' | 'director';
};

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: ReviewItem[];
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

export default function ReviewModal({ isOpen, onClose, items, title }: ReviewModalProps) {
  if (!isOpen) return null;

  function CardEvaluation({ campos, isHeader = false }: CardEvaluationProps) {
    const containerClass = isHeader
      ? 'w-full h-[50px] rounded-md bg-azulEscuroPage'
      : 'w-full h-[50px] rounded-md bg-azulEscuroCard border border-azulClaroBorder';

    const textClass = isHeader
      ? 'font-poppins font-semibold text-[16px] text-azulClaroBorder'
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
              !isHeader ? 'border-r border-azulClaroBorder justify-start' : ''
            }`}
          >
            {isHeader ? (
              <p className={`${textClass} truncate`}>{campos[0] ?? '-'}</p>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={userIcon}
                  alt="Usuário"
                  className="w-[30px] h-[30px] rounded-full shrink-0"
                />
                <p className={`${textClass} truncate`}>{campos[0] ?? '-'}</p>
              </div>
            )}
          </div>

          {/* Coluna 1 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-azulClaroBorder' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[1] ?? '-'}</p>
          </div>

          {/* Coluna 2 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-azulClaroBorder' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[2] ?? '-'}</p>
          </div>

          {/* Coluna 3 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-azulClaroBorder' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[3] ?? '-'}</p>
          </div>

          {/* Coluna 4 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-azulClaroBorder' : ''}`}>
            <p className={`${textClass} truncate`}>{campos[4] ?? '-'}</p>
          </div>

          {/* Coluna 5 */}
          <div className={`${cellBase} ${!isHeader ? 'border-r border-azulClaroBorder' : ''}`}>
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

      <div className="relative w-[92%] max-w-6xl rounded-md bg-azulEscuroPage border border-azulClaroBorder shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-azulClaroBorder/40">
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
          {items.length === 0 ? (
            <p className="text-gray-400 font-poppins">
              Nenhuma avaliação pendente para revisar.
            </p>
          ) : (
            <div className="w-full overflow-x-auto no-scrollbar">
              <div className="max-h-[65vh] overflow-y-auto pb-6 pr-3 relative">

                <div className="min-w-[920px] flex flex-col gap-8">
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
                      <p className="text-azulClaroBorder font-poppins font-semibold">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
