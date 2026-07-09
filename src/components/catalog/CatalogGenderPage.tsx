import React, { useMemo } from 'react';
import type { CatalogQueryParams } from '../../api/api';
import { CatalogBrowsePageView } from './CatalogBrowsePage';

// Routes: `/catalog/women`, `/catalog/men`
// Purpose: thin scoped wrapper around the shared catalog browse implementation.
// The UI is intentionally the same as `/catalog/all`; only the API scope differs.
const CatalogGenderPage: React.FC<{ gender: 'men' | 'women' }> = ({ gender }) => {
    const fixedQueryParams = useMemo<Partial<CatalogQueryParams>>(
        () => ({ genders: [gender, 'unisex'] }),
        [gender]
    );

    return <CatalogBrowsePageView fixedQueryParams={fixedQueryParams} />;
};

export default CatalogGenderPage;
