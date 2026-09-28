import { FaPen } from "react-icons/fa";
import Card from "./Card";
import Button from "./Button";

interface ProjectProps {
  nome?: string;
  membros: string[];
  evaluate: (value: string | null) => void;
  submit: () => void;
  loading?: boolean;
  onEditTitle?: () => void;
  onReview?: () => void;
}

export default function Project({
  nome,
  membros,
  evaluate,
  submit,
  loading = false,
  onEditTitle,
  onReview,
}: ProjectProps) {
  
  return (
    <div className="flex flex-col font-poppins text-white w-full gap-6 pt-6 animate-fade-in">
      
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between border-b border-[#001A33] pb-3">
        <div className="flex items-center gap-3 group">
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {nome || "Equipe"}
          </h2> 
          {onEditTitle && (
            <button 
              onClick={onEditTitle}
              className="text-gray-500 hover:text-laranja transition-colors text-lg opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-white/5"
              title="Alterar nome do projeto"
            >
              <FaPen />
            </button>
          )}
        </div>
        
        {/* Badge de Contagem */}
        <span className="bg-[#001A33] text-azulClaroCheck text-sm font-semibold px-3 py-1 rounded-full border border-azulClaroBorder/30">
          {membros.length} {membros.length === 1 ? 'membro' : 'membros'}
        </span>
      </div>

      {/* Grid de Cards (Substituindo o Carrossel) */}
      {membros.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {membros.map((membroNome, idx) => (
            <div key={idx} className="w-full flex justify-center sm:justify-start">
              {/* O componente Card precisará ter largura 100% no arquivo dele para preencher o grid */}
              <Card nome={membroNome} evaluate={() => evaluate(membroNome)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-[#001A33] rounded-2xl bg-azulEscuroPage/50">
          <span className="text-4xl mb-3">👻</span>
          <p className="text-gray-400 text-center">Ninguém para avaliar nesta seção.</p>
        </div>
      )}

      {/* Ações (Botões de Envio e Revisão) */}
      {membros.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-[#001A33] w-full justify-end">
          <div className="w-full sm:w-auto">
            <Button tipo={1} submit={submit} onReview={onReview} /> 
          </div>
          <div className="w-full sm:w-auto">
            <Button tipo={0} submit={submit} loading={loading} />
          </div>
        </div>
      )}
      
    </div>
  );
}