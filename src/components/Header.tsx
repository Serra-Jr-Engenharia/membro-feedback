import userIcon from "../assets/userIcon.svg";
import logoSerra from "../assets/LogoSerra.svg";

interface GestorProps {
  nome: string;
  pfp?: string; // pfp -> profile picture
  logout: () => void;
}

export default function Header({ nome, pfp, logout }: GestorProps) {
  return (
    <header className="flex justify-between pl-6 items-center bg-azulEscuroPage w-full h-[90px] font-poppins text-white">
      <img src={logoSerra} alt="Logo Serra Jr." className="min-w-[200px]" />
      <h1 className="text-4xl font-bold text-center">Avaliação de Membros</h1>
      <div className="flex justify-center items-center gap-2 min-w-[200px]">
        <div className="flex flex-col justify-center items-end ">
          <h3 className="text-[16px] font-medium text-right">{nome}</h3>
          <button
            onClick={logout}
            className="text-[14px] font-normal cursor-pointer hover:text-laranja duration-100"
          >
            Sair
          </button>
        </div>
        <img src={pfp || userIcon} alt="Profile Picture" />
      </div>
    </header>
  );
}
