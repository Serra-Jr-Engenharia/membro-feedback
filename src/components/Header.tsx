import userIcon from "../assets/userIcon.svg";
import logoSerra from "../assets/LogoSerra.svg";

interface HeaderProps {
  nome: string;
  pfp?: string;
  logout: () => void;
  deleteAccount: () => void; 
}

export default function Header({ nome, pfp, logout, deleteAccount }: HeaderProps) {
  return (
    <header className="flex justify-between pl-6 items-center bg-azulEscuroPage w-full h-[90px] font-poppins text-white">
      <img src={logoSerra} alt="Logo Serra Jr." className="min-w-[200px]" />
      <h1 className="text-4xl font-bold text-center">Avaliação de Membros</h1>
      
      <div className="flex justify-center items-center gap-3 min-w-[200px]">
        <div className="flex flex-col justify-center items-end gap-1">
          <h3 className="text-[16px] font-medium text-right">{nome}</h3>
          
          <div className="flex gap-3 text-[12px]">
            {/* Botão de Excluir Conta */}
            <button
              onClick={deleteAccount}
              className="font-normal text-red-500 hover:text-red-400 underline decoration-red-500/30 hover:decoration-red-400 transition-colors"
              title="Apagar minha conta e dados permanentemente"
            >
              Excluir Conta
            </button>

            {/* Divisor */}
            <span className="text-gray-600">|</span>

            {/* Botão Sair */}
            <button
              onClick={logout}
              className="font-normal cursor-pointer hover:text-laranja transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
        <img src={pfp || userIcon} alt="Profile Picture" className="w-[50px]" />
      </div>
    </header>
  );
}