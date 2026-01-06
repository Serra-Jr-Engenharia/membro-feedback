import sent from '../../assets/Sent.svg'
import document from '../../assets/document.svg'

interface ButtonProps {
  tipo: boolean | number;
  submit: () => void;
  loading?: boolean;

  onReview?: () => void;
}

export default function Button({ tipo, submit, loading = false, onReview }: ButtonProps) {
  const isReview = Boolean(tipo);

  const handleClick = () => {
    if (loading) return;

    if (isReview) {
      onReview?.();
      return;
    }

    submit();
  };

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
        {isReview ? 'Review' : (loading ? 'Enviando...' : 'Enviar')}
      </p>

      {!loading && <img src={isReview ? document : sent} alt="icon" />}
    </button>
  );
}
