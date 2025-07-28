import React from 'react';
import '../styles/FloatingHearts.css';

import heart1 from '../assets/rightupHeart.png';
import heart2 from '../assets/rightdownHeart.png';
import heart3 from '../assets/leftHeart.png';

const hearts = [
    { id: 1, left: '70%', top:'0%', size: 500, src: heart1 },
    { id: 2, left: '70%', top: '45%', size: 500, src: heart2 },
    { id: 3, left: '-10%', top: '0%', size: 900, src: heart3 },
];

const FloatingHearts = () => {
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
};

export default FloatingHearts;