import React from 'react';

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, lastPage, onPageChange }) => {
    if (lastPage <= 1) return null;

    const getPages = () => {
        const pages: (number | string)[] = [];
        const delta = 2;

        for (let i = 1; i <= lastPage; i++) {
            if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-1.5 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                ← Prev
            </button>

            {getPages().map((page, index) =>
                typeof page === 'string' ? (
                    <span key={`dot-${index}`} className="px-2 text-dark-500">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-9 h-9 text-sm rounded-lg transition-all ${page === currentPage
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                                : 'text-dark-400 hover:text-white hover:bg-dark-700'
                            }`}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="px-3 py-2 text-sm text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                Next →
            </button>
        </div>
    );
};

export default Pagination;
