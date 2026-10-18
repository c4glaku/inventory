const isMissingValue = value => value === null
    || value === undefined
    || value === ''
    || (typeof value === 'number' && !Number.isFinite(value));

const compareValues = (first, second) => {
    if (first === second) return 0;

    const firstIsNumber = typeof first === 'number';
    const secondIsNumber = typeof second === 'number';
    if (firstIsNumber && secondIsNumber) return first - second;

    return String(first).localeCompare(String(second), undefined, {
        numeric: true,
        sensitivity: 'base',
    });
};

export const cycleSort = (currentSort, property) => {
    if (currentSort.property !== property) {
        return { property, direction: 'asc' };
    }

    if (currentSort.direction === 'asc') {
        return { property, direction: 'desc' };
    }

    return { property: null, direction: 'asc' };
};

export const sortTableRows = (
    rows,
    sort,
    defaultSort = null,
    getSortValue = (row, property) => row[property]
) => {
    const activeSort = sort.property
        ? sort
        : defaultSort;

    if (!activeSort) return rows;

    const direction = activeSort.direction === 'desc' ? -1 : 1;

    return rows
        .map((row, index) => ({ row, index }))
        .sort((first, second) => {
            const firstValue = getSortValue(first.row, activeSort.property);
            const secondValue = getSortValue(second.row, activeSort.property);
            const firstIsMissing = isMissingValue(firstValue);
            const secondIsMissing = isMissingValue(secondValue);

            // Keep empty values at the bottom for both sort directions.
            if (firstIsMissing || secondIsMissing) {
                if (firstIsMissing && secondIsMissing) return first.index - second.index;
                return firstIsMissing ? 1 : -1;
            }

            const comparison = compareValues(firstValue, secondValue);
            return comparison === 0
                ? first.index - second.index
                : comparison * direction;
        })
        .map(({ row }) => row);
};
