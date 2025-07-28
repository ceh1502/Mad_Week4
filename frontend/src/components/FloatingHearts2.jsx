import React from 'react';
import '../styles/FloatingHearts.css';

import heart1 from '../assets/heart1.png';
import heart2 from '../assets/heart2.png';
import heart3 from '../assets/heart3.png';
import heart4 from '../assets/heart4.png';

const FloatingHearts2=()=>{
    const hearts = [
        { id: 1, left: '-5%', top: '10%', size: 500, src: heart1 },
        { id: 2, left: '50%', top: '0%', size: 800, src: heart2 },
        { id: 3, left: '70%', top: '50%', size: 500, src: heart3 },
        { id: 4, left: '0%', top: '50%', size: 700, src: heart4 },
    ];

    return (
        <>
            {hearts.map((heart) => (
                <img
                    key={heart.id}
                    src={heart.src}
                    alt={`heart-${heart.id}`}
                    className="floating-heart"
                    style={{
                        top: heart.top,
                        left: heart.left,
                        width: `${heart.size}px`,
                        height: `${heart.size}px`,
                    }}
                />
            ))}
        </>
    );  
}
export default FloatingHearts2;