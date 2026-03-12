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
            className={`glass-card p-6 ${hover ? 'cursor-pointer' : ''
                } ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
