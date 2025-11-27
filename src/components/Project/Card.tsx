import userIcon from '../../assets/userIcon.svg'

interface UserProps {
  nome: string
  pfp?: string // pfp -> profile picture
  evaluate: () => void
}

export default function Card({ nome, evaluate }: UserProps) {
  return (
    <div
      onClick={evaluate}
      className="select-none flex flex-col w-[150px] h-[130px] gap-1 cursor-pointer hover:scale-105 duration-300 bg-azulEscuroCard justify-center items-center rounded-[6px] border-[1px] border-azulClaroBorder"
    >
      <img src={userIcon} alt="Profile Picture" />
      <p className="font-poppins font-semibold text-[16px] w-[80%] text-center overflow-hidden text-ellipsis whitespace-nowrap">
        {nome}
      </p>
    </div>
  )
}
