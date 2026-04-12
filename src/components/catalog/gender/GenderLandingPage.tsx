import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GenderLandingPage: React.FC = () => {
    return (
        <div className="flex min-h-screen w-full">
            {/* Men side */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex w-1/2 items-center justify-center bg-neutral-900 transition-colors hover:bg-neutral-800"
            >
                <Link
                    to="/catalog/men"
                    className="flex flex-col items-center gap-4 p-12 text-white"
                >
                    <span className="text-5xl font-black tracking-widest uppercase md:text-6xl">
                        Men
                    </span>
                    <span className="text-sm font-medium text-neutral-400">
                        Shop Men's Collection
                    </span>
                </Link>
            </motion.div>

            {/* Women side */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex w-1/2 items-center justify-center bg-white transition-colors hover:bg-neutral-100"
            >
                <Link
                    to="/catalog/women"
                    className="flex flex-col items-center gap-4 border-l border-neutral-200 p-12 text-neutral-900"
                >
                    <span className="text-5xl font-black tracking-widest uppercase md:text-6xl">
                        Women
                    </span>
                    <span className="text-sm font-medium text-neutral-600">
                        Shop Women's Collection
                    </span>
                </Link>
            </motion.div>
        </div>
    );
};

export default GenderLandingPage;
