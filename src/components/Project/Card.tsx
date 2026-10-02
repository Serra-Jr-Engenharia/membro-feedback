import userIcon from '../../assets/userIcon.svg'
import { FaCheckCircle } from 'react-icons/fa'

interface UserProps {
  nome: string
  pfp?: string 
  evaluate: () => void
  status?: 'evaluated' | 'draft' | 'pending'
}

export default function Card({ nome, pfp, evaluate, status = 'pending' }: UserProps) {
  const isEvaluated = status === 'evaluated'
  const isDraft = status === 'draft'

  return (
    <div
      onClick={evaluate}
      className={`relative select-none flex flex-col w-[150px] h-[130px] gap-1 cursor-pointer hover:scale-105 duration-300 bg-azulEscuroCard justify-center items-center rounded-[6px] border-[1px] transition-colors ${
        isEvaluated
          ? 'border-green-500/60 bg-green-500/5'
          : isDraft
          ? 'border-laranja/60 bg-laranja/5'
          : 'border-azulClaroBorder'
      }`}
    >
      {isEvaluated && (
        <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-950/80 border border-green-500/40 px-1.5 py-0.5 rounded-full">
          <FaCheckCircle className="text-[9px]" /> Feito
        </span>
      )}
      {isDraft && (
        <span className="absolute top-1.5 right-1.5 text-[10px] font-semibold text-laranja bg-laranja/10 border border-laranja/40 px-1.5 py-0.5 rounded-full">
          Rascunho
        </span>
      )}
      <img src={pfp || userIcon} alt="Profile Picture" />
      <p className="font-poppins font-semibold text-[16px] w-[80%] text-center overflow-hidden text-ellipsis whitespace-nowrap">
        {nome}
      </p>
    </div>
  )
}
