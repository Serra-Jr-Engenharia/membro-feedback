import { useState } from 'react'
import { FaStar } from 'react-icons/fa' 

type StarRatingProps = {
  rating: number;
  setRating: (rating: number) => void;
}

export default function StarRating({ rating, setRating }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex flex-row gap-1"> 
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1
        
        return (
          <label key={starValue} className="cursor-pointer">
            <input
              type="radio"
              name="rating"
              value={starValue}
              onClick={() => setRating(starValue)}
              className="hidden"
            />
            <FaStar
              size={25}
              className={starValue <= (hover || rating) ? 'text-[#FF6600]' : 'text-gray-500'}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}
            />
          </label>
        )
      })}
    </div>
  )
}