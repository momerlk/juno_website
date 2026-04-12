import React from 'react';
import { useParams } from 'react-router-dom';
import GenderCatalogPage from './gender/GenderCatalogPage';
import CatalogProductPage from './CatalogProductPage';

/**
 * Router component that determines whether to show gender catalog or product page
 * based on the URL parameter.
 */
const GenderOrProductRouter: React.FC = () => {
    const { genderOrId } = useParams<{ genderOrId: string }>();

    // Check if it's a gender route
    if (genderOrId === 'men' || genderOrId === 'women') {
        return <GenderCatalogPage />;
    }

    // Otherwise, treat it as a product ID
    return <CatalogProductPage />;
};

export default GenderOrProductRouter;
