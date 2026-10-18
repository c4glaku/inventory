import React from 'react';
import { TableCell, TableSortLabel } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

const SortableTableCell = ({
    property,
    label,
    sortBy,
    sortDirection,
    onSort,
    align = 'left',
}) => {
    const active = sortBy === property;
    const nextAction = !active
        ? 'sort ascending'
        : sortDirection === 'asc'
            ? 'sort descending'
            : 'reset to the default order';

    return (
        <TableCell align={align} sortDirection={active ? sortDirection : false}>
            <TableSortLabel
                active={active}
                direction={active ? sortDirection : 'asc'}
                IconComponent={active ? ArrowDownwardIcon : UnfoldMoreIcon}
                onClick={() => onSort(property)}
                aria-label={`${label}: ${nextAction}`}
                sx={{
                    whiteSpace: 'nowrap',
                    '& .MuiTableSortLabel-icon': {
                        opacity: 1,
                        fontSize: '1rem',
                        ml: 0.5,
                    },
                }}
            >
                {label}
            </TableSortLabel>
        </TableCell>
    );
};

export default SortableTableCell;
