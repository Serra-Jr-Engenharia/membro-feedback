import sent from '../../assets/Sent.svg'
import document from '../../assets/document.svg'

interface ButtonProps {
    tipo: boolean | number;
    submit: () => void;
    loading?: boolean;
}

export default function Button({ tipo, submit, loading = false }: ButtonProps) {
    const review = () => {
        alert("Review")
    }

    const isReview = Boolean(tipo);

    const handleClick = () => {
        if (loading) return;
        
        isReview ? review() : submit();
    }

    return (
        <button 
            onClick={handleClick}
            disabled={loading} 
            className={`flex w-[140px] rounded-md border 
                ${isReview ? 'border-laranja' : 'border-azulClaroBorder'} 
                p-2 duration-300 cursor-pointer justify-center items-center gap-2 bg-azulEscuroCard
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} 
            `}
        >
            <p className="font-poppins text-white text-[20px] font-semibold">
                {/* Muda o texto se estiver carregando */}
                {isReview 
                    ? 'Review' 
                    : (loading ? 'Enviando...' : 'Enviar')
                }
            </p>
            
            {/* Oculta o ícone durante o carregamento para limpar o visual, se preferir */}
            {!loading && (
                <img src={isReview ? document : sent} alt="icon" />
            )}
        </button>
    )
}