import React, { ReactNode } from 'react';
import { motion, Transition } from 'framer-motion';

const pageVariants = {
    initial: { opacity: 0, y: 15 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -15 }
};

const pageTransition: Transition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
};

const PageTransition: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            style={{ width: '100%', height: 'auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
