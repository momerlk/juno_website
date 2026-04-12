import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type Props = {
    gender: 'men' | 'women';
    total: number;
};

const GenderHeader: React.FC<Props> = ({ gender, total }) => {
    const label = gender === 'men' ? "Men" : "Women";

    return (
        <div className="mb-8">
            <Link
                to="/catalog"
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
            >
                <ArrowLeft size={16} />
                Back to Shop
            </Link>

            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    {label}'s Collection
                </h1>
                <span className="text-sm text-neutral-400">{total} products</span>
            </div>
        </div>
    );
};

export default GenderHeader;
