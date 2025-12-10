import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { FaPen } from "react-icons/fa";
import arrowIcon from "../../assets/left.svg";
import Card from "./Card";
import Button from "./Button";

interface ProjectProps {
  nome?: string;
  membros: string[];
  evaluate: (value: string | null) => void;
  submit: () => void;
  loading?: boolean;
  onEditTitle?: () => void;
}

export default function Project({
  nome,
  membros,
  evaluate,
  submit,
  loading = false,
  onEditTitle,
}: ProjectProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    slidesToScroll: 2,
    dragFree: false,
  });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  return (
    <div className="flex flex-col font-poppins text-white font-medium text-2xl gap-1 pt-10">
      
      <div className="flex items-center gap-3 group">
        <h2 className="text-white">{nome || "Projeto"}</h2> 
        {onEditTitle && (
          <button 
            onClick={onEditTitle}
            className="text-gray-500 hover:text-laranja transition-colors text-lg opacity-0 group-hover:opacity-100 p-1"
            title="Alterar nome do projeto"
          >
            <FaPen />
          </button>
        )}
      </div>
      
      <hr className="bg-laranja w-[350px] h-0.5 border-none outline-0" />

      <div className="flex gap-4 items-center">
        <button type="button" onClick={scrollPrev} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <img
            src={arrowIcon}
            className="max-h-[22px] max-w-[15px] cursor-pointer"
            alt="Anterior"
          />
        </button>

        <div
          ref={emblaRef}
          className="overflow-x-hidden overflow-y-visible pr-4"
        >
          <div className="flex gap-6 py-2 pl-2">
            {membros.map((membroNome, idx) => (
              <div
                key={idx}
                className="shrink-0 flex justify-center items-center"
              >
                <Card nome={membroNome} evaluate={() => evaluate(membroNome)} />
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={scrollNext} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <img
            src={arrowIcon}
            className="max-h-[22px] max-w-[15px] cursor-pointer rotate-180"
            alt="Próximo"
          />
        </button>

        <div className="flex flex-col gap-2">
          <Button tipo={1} submit={submit} />
          <Button tipo={0} submit={submit} loading={loading} />
        </div>
      </div>
    </div>
  );
}