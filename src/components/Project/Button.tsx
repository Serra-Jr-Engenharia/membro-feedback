import ActionButton from "../ui/ActionButton";

interface ButtonProps {
  tipo: boolean | number;
  submit: () => void;
  loading?: boolean;
  onReview?: () => void;
  count?: number;
}

export default function Button({
  tipo,
  submit,
  loading = false,
  onReview,
  count = 0,
}: ButtonProps) {
  const isReview = Boolean(tipo);
  const noun = count === 1 ? "avaliação" : "avaliações";

  const handleClick = () => {
    if (loading) return;

    if (isReview) {
      onReview?.();
      return;
    }

    submit();
  };

  return (
    <ActionButton
      variant={isReview ? "secondary" : "primary"}
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
    >
      {isReview
        ? `Revisar ${noun}`
        : loading
          ? "Enviando..."
          : `Enviar ${noun}`}
    </ActionButton>
  );
}
