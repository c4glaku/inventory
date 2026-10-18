import assert from 'node:assert/strict';
import test from 'node:test';
import { cycleSort, sortTableRows } from './tableSorting.js';

test('cycles a selected column through ascending, descending, and default', () => {
    const ascending = cycleSort({ property: null, direction: 'asc' }, 'quantity');
    const descending = cycleSort(ascending, 'quantity');
    const reset = cycleSort(descending, 'quantity');

    assert.deepEqual(ascending, { property: 'quantity', direction: 'asc' });
    assert.deepEqual(descending, { property: 'quantity', direction: 'desc' });
    assert.deepEqual(reset, { property: null, direction: 'asc' });
});

test('selecting a different column starts it in ascending order', () => {
    assert.deepEqual(
        cycleSort({ property: 'name', direction: 'desc' }, 'quantity'),
        { property: 'quantity', direction: 'asc' }
    );
});

test('sorts numeric fields numerically in both directions', () => {
    const rows = [{ quantity: 11 }, { quantity: 2 }, { quantity: 3 }];

    assert.deepEqual(
        sortTableRows(rows, { property: 'quantity', direction: 'asc' }).map(row => row.quantity),
        [2, 3, 11]
    );
    assert.deepEqual(
        sortTableRows(rows, { property: 'quantity', direction: 'desc' }).map(row => row.quantity),
        [11, 3, 2]
    );
});

test('sorts text naturally without case sensitivity', () => {
    const rows = [{ sku: 'part10' }, { sku: 'Part2' }, { sku: 'PART1' }];

    assert.deepEqual(
        sortTableRows(rows, { property: 'sku', direction: 'asc' }).map(row => row.sku),
        ['PART1', 'Part2', 'part10']
    );
});

test('keeps blank values at the bottom and preserves stable ties', () => {
    const rows = [
        { name: 'A', price: 2 },
        { name: 'B', price: null },
        { name: 'C', price: 2 },
        { name: 'D', price: 10 },
    ];

    assert.deepEqual(
        sortTableRows(rows, { property: 'price', direction: 'asc' }).map(row => row.name),
        ['A', 'C', 'D', 'B']
    );
    assert.deepEqual(
        sortTableRows(rows, { property: 'price', direction: 'desc' }).map(row => row.name),
        ['D', 'A', 'C', 'B']
    );
});

test('returns the table default order after sorting is reset', () => {
    const rows = [{ name: 'Zulu' }, { name: 'Alpha' }];
    const defaultSort = { property: 'name', direction: 'asc' };

    assert.deepEqual(
        sortTableRows(rows, { property: null, direction: 'asc' }, defaultSort),
        [{ name: 'Alpha' }, { name: 'Zulu' }]
    );
});
