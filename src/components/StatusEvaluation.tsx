import { useState } from "react";
import userIcon from "../assets/userIcon.svg";
import Check from "../assets/check.svg";
import Clock from "../assets/clock.svg";

interface CircleProps {
  number?: number;
  icon?: number;
}

interface MembersProps {
  totalMembers: number;
  evaluated: number;
  pending: number;
}

function Circle({ number, icon }: CircleProps) {
  let iconChoosed;

  if (icon === 0) {
    iconChoosed = userIcon;
  } else if (icon === 1) {
    iconChoosed = Check;
  } else {
    iconChoosed = Clock;
  }

  return (
    <div className="relative flex w-[100px] h-[100px] bg-azulEscuroCard rounded-full border-azulClaroBorder border-2 justify-center items-center">
      <h1 className="text-2xl font-semibold text-white">{number}</h1>
      <div className="absolute flex justify-center items-center right-0 -top-2.5 bg-azulEscuroCard w-12 h-12 rounded-full">
        <img width={36} height={36} src={iconChoosed} />
      </div>
    </div>
  );
}

export default function StatusEvaluation({
  totalMembers,
  evaluated,
  pending,
}: MembersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-2 z-40">
      <div className="bg-azulEscuroCard/95 border border-azulClaroBorder rounded-t-2xl shadow-xl px-4 pt-2 pb-3 min-w-[320px]">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 text-sm text-gray-200 cursor-pointer"
        >
          <div className="flex flex-col text-left">
            <span className="font-semibold text-white">
              Status das avaliações
            </span>
            <span className="text-xs text-gray-300">
              {evaluated}/{totalMembers} avaliados •{" "}
              <span
                className={`text-xs ${
                  pending > 0 ? `text-laranja` : `text-gray-300`
                } `}
              >
                {pending} pendentes
              </span>
            </span>
          </div>
          <span
            className={`text-lg transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ▲
          </span>
        </button>

        {isOpen && (
          <div className="mt-4 flex gap-4 justify-center">
            <Circle number={totalMembers} icon={0} />
            <Circle number={evaluated} icon={1} />
            <Circle number={pending} icon={2} />
          </div>
        )}
      </div>
    </div>
  );
}
