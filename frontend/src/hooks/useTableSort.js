import { useCallback, useMemo, useState } from 'react';
import { cycleSort, sortTableRows } from '../lib/tableSorting';

export const useTableSort = (
    rows,
    defaultSort = null,
    getSortValue = (row, property) => row[property]
) => {
    const [sort, setSort] = useState({ property: null, direction: 'asc' });

    const requestSort = useCallback(property => {
        setSort(current => cycleSort(current, property));
    }, []);

    const sortedRows = useMemo(() => {
        return sortTableRows(rows, sort, defaultSort, getSortValue);
    }, [defaultSort, getSortValue, rows, sort]);

    return {
        sortedRows,
        sortBy: sort.property,
        sortDirection: sort.direction,
        requestSort,
    };
};
