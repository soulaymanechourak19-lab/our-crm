import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-2xl p-6 ${hover ? 'hover:border-dark-600/50 hover:bg-dark-800/70 cursor-pointer transition-all duration-200' : ''
                } ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
