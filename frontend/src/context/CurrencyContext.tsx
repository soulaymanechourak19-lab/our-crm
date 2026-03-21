import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'USD' | 'EUR' | 'MAD';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<Currency>(() => {
        return (localStorage.getItem('currency') as Currency) || 'USD';
    });

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    const setCurrency = (c: Currency) => {
        setCurrencyState(c);
    };

    const formatCurrency = (amount: number) => {
        const locales: Record<Currency, string> = {
            USD: 'en-US',
            EUR: 'de-DE', // commonly formats as 1.234,56 €
            MAD: 'fr-MA', // formats as 1 234,56 MAD or DH
        };

        // Static conversion rates (Base: USD)
        const exchangeRates: Record<Currency, number> = {
            USD: 1,
            EUR: 0.92,   // 1 USD approx 0.92 EUR
            MAD: 10.15,  // 1 USD approx 10.15 MAD
        };

        const numValue = Number(amount);
        if (isNaN(numValue)) return '';

        const convertedValue = numValue * exchangeRates[currency];

        return new Intl.NumberFormat(locales[currency], {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(convertedValue);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = (): CurrencyContextType => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
