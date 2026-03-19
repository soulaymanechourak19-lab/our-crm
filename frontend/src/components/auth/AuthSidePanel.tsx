import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AuthSidePanel: React.FC = () => {
    const { t } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            titleKey: 'authSidePanel.slide1Title',
            descKey: 'authSidePanel.slide1Desc',
        },
        {
            titleKey: 'authSidePanel.slide2Title',
            descKey: 'authSidePanel.slide2Desc',
        },
        {
            titleKey: 'authSidePanel.slide3Title',
            descKey: 'authSidePanel.slide3Desc',
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="auth-side-panel">
            <div className="auth-side-content">
                <div className="auth-side-logo animate-fade-in-up">
                    <div className="auth-side-logo-icon">C</div>
                    <span className="auth-side-logo-text">OurCRM</span>
                </div>
                
                <div style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div key={currentSlide} className="animate-fade-in">
                        <h2 className="auth-side-title" style={{ whiteSpace: 'pre-line' }}>{String(t(slides[currentSlide].titleKey))}</h2>
                        <p className="auth-side-desc">{String(t(slides[currentSlide].descKey))}</p>
                    </div>
                </div>
                
                <div className="auth-side-dots" style={{ zIndex: 10 }}>
                    {slides.map((_, index) => (
                        <span 
                            key={index}
                            className={`auth-dot ${index === currentSlide ? 'active' : ''}`} 
                            onClick={() => setCurrentSlide(index)}
                            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AuthSidePanel;
