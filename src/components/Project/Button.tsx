import sent from '../../assets/Sent.svg'
import document from '../../assets/document.svg'

interface ButtonProps {
    tipo: boolean | number;
    submit: () => void;
}

export default function Button({tipo, submit}:ButtonProps) {
    const review = () => {
        alert("Review")
    }


    return (
        <button 
        onClick={tipo ? review : submit} 
        className={`flex w-[140px] rounded-md border ${tipo ? 'border-laranja' : 'border-azulClaroBorder'}  p-2 hover:scale-105 duration-300 cursor-pointer justify-center items-center gap-2 bg-azulEscuroCard`}>
            <p className="font-poppins text-white text-[20px] font-semibold">{tipo ? 'Review' : 'Enviar'}</p>
            <img src={tipo ? document : sent}></img>
        </button>
    )
}