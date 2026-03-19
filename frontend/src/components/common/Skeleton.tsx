import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
    circle?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '8px',
    className = '',
    style,
    circle = false
}) => {
    return (
        <div
            className={`animate-pulse bg-dark-700/50 ${className}`}
            style={{
                width,
                height,
                borderRadius: circle ? '50%' : borderRadius,
                ...style
            }}
        />
    );
};

export default Skeleton;
