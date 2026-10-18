import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SortableTableCell from '../common/SortableTableCell';
import { useTableSort } from '../../hooks/useTableSort';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import api from '../../api/axios';

const countFormatter = new Intl.NumberFormat();
const valueFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const numberOrZero = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatCount = value => countFormatter.format(value);
const formatValue = value => valueFormatter.format(value);
const truncate = (value, maxLength = 22) => (
    value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
);

const stockStatus = (quantity, minimum) => {
    if (quantity <= 0) return 'Out of stock';
    if (quantity <= minimum) return 'Low stock';
    return 'In stock';
};

const statusColor = {
    'Out of stock': 'error',
    'Low stock': 'warning',
    'In stock': 'success',
};

const stockColors = {
    'Out of stock': '#d32f2f',
    'Low stock': '#ed6c02',
    'In stock': '#2e7d32',
};

const getStatisticsSortValue = (row, property) => {
    if ([
        'productCount',
        'units',
        'atOrBelowMinimum',
        'stockValue',
        'quantity',
    ].includes(property)) {
        return Number(row[property]);
    }
    if (property === 'unitPrice' || property === 'value') {
        return row[property] === null ? null : Number(row[property]);
    }
    return row[property];
};

const productSortLabels = {
    name: 'product name',
    supplierName: 'supplier',
    quantity: 'quantity',
    unitPrice: 'unit price',
    value: 'stock value',
    status: 'stock status',
};

const MetricCard = ({ label, value, detail, color = 'primary.main' }) => (
    <Paper
        variant="outlined"
        sx={{
            height: '100%',
            p: 2,
            borderTop: '3px solid',
            borderTopColor: color,
        }}
    >
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{detail}</Typography>
    </Paper>
);

const ChartPanel = ({ title, subtitle, children }) => (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
        </Typography>
        {children}
    </Paper>
);

const Statistics = () => {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const theme = useTheme();

    const loadStatistics = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [productsResponse, suppliersResponse] = await Promise.all([
                api.get('/products'),
                api.get('/suppliers'),
            ]);
            setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
            setSuppliers(Array.isArray(suppliersResponse.data) ? suppliersResponse.data : []);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                || requestError.response?.data?.error
                || 'Could not load inventory statistics. Check your connection and try again.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    const stats = useMemo(() => {
        const supplierById = new Map(suppliers.map(supplier => [String(supplier.id), supplier]));
        const supplierMetrics = new Map(suppliers.map(supplier => [String(supplier.id), {
            id: supplier.id,
            name: supplier.name,
            email: supplier.email,
            contactName: supplier.contact_name,
            productCount: 0,
            units: 0,
            atOrBelowMinimum: 0,
            outOfStock: 0,
            stockValue: 0,
        }]));
        const stockCounts = { 'Out of stock': 0, 'Low stock': 0, 'In stock': 0 };
        let totalUnits = 0;
        let totalStockValue = 0;
        let unpricedProducts = 0;

        const productRows = products.map(product => {
            const quantity = numberOrZero(product.quantity);
            const minimum = numberOrZero(product.min_quantity);
            const hasPrice = product.unit_price !== null
                && product.unit_price !== undefined
                && product.unit_price !== ''
                && Number.isFinite(Number(product.unit_price));
            const unitPrice = hasPrice ? Number(product.unit_price) : null;
            const value = hasPrice ? quantity * unitPrice : null;
            const status = stockStatus(quantity, minimum);
            const supplierKey = product.supplier_id == null ? 'unassigned' : String(product.supplier_id);
            const supplier = supplierById.get(supplierKey);
            const supplierName = supplier?.name
                || (supplierKey === 'unassigned' ? 'Unassigned' : `Unknown supplier #${supplierKey}`);

            stockCounts[status] += 1;
            totalUnits += quantity;
            if (hasPrice) totalStockValue += value;
            else unpricedProducts += 1;

            let supplierSummary = supplierMetrics.get(supplierKey);
            if (!supplierSummary) {
                supplierSummary = {
                    id: supplierKey,
                    name: supplierName,
                    email: '',
                    contactName: '',
                    productCount: 0,
                    units: 0,
                    atOrBelowMinimum: 0,
                    outOfStock: 0,
                    stockValue: 0,
                };
                supplierMetrics.set(supplierKey, supplierSummary);
            }

            supplierSummary.productCount += 1;
            supplierSummary.units += quantity;
            if (status !== 'In stock') supplierSummary.atOrBelowMinimum += 1;
            if (status === 'Out of stock') supplierSummary.outOfStock += 1;
            if (hasPrice) supplierSummary.stockValue += value;

            return {
                ...product,
                quantity,
                minimum,
                unitPrice,
                value,
                status,
                supplierName,
            };
        });

        const supplierRows = [...supplierMetrics.values()]
            .sort((first, second) => second.stockValue - first.stockValue || first.name.localeCompare(second.name));
        const productsByValue = productRows
            .filter(product => product.value !== null)
            .sort((first, second) => second.value - first.value || second.quantity - first.quantity);

        return {
            productRows,
            supplierRows,
            stockCounts,
            totalUnits,
            totalStockValue,
            unpricedProducts,
            atOrBelowMinimum: stockCounts['Out of stock'] + stockCounts['Low stock'],
            productsByValue,
        };
    }, [products, suppliers]);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase();
        return stats.productRows
            .filter(product => statusFilter === 'all' || product.status === statusFilter)
            .filter(product => !normalizedSearch || [product.name, product.sku, product.supplierName]
                .some(value => String(value || '').toLocaleLowerCase().includes(normalizedSearch)))
            .sort((first, second) => (second.value || 0) - (first.value || 0)
                || first.name.localeCompare(second.name));
    }, [search, statusFilter, stats.productRows]);

    const supplierTable = useTableSort(
        stats.supplierRows,
        null,
        getStatisticsSortValue
    );
    const productTable = useTableSort(
        filteredProducts,
        null,
        getStatisticsSortValue
    );

    const stockStatusData = Object.entries(stats.stockCounts)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0);
    const topProducts = stats.productsByValue.slice(0, 10);
    const topSuppliers = stats.supplierRows
        .filter(supplier => supplier.stockValue > 0)
        .slice(0, 8);

    const chartTooltipStyle = {
        contentStyle: {
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
        },
        labelStyle: { color: theme.palette.text.primary },
    };
    const axisTick = { fill: theme.palette.text.secondary, fontSize: 12 };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
    }

    if (error) {
        return (
            <Alert
                severity="error"
                action={<Button color="inherit" size="small" onClick={loadStatistics}>Retry</Button>}
            >
                {error}
            </Alert>
        );
    }

    return (
        <Stack spacing={3}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                spacing={2}
            >
                <Box>
                    <Typography variant="h4" component="h1">Inventory statistics</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        Full-catalog view across {formatCount(products.length)} products and {formatCount(suppliers.length)} suppliers.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button component={RouterLink} to="/products" variant="outlined">Products</Button>
                    <Button startIcon={<RefreshIcon />} onClick={loadStatistics} variant="contained">
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            <Alert severity="info">
                Product categories are not currently stored in the catalog, so these breakdowns use stock health and supplier. Inventory value is quantity multiplied by unit price; currency is not configured, so keep price units consistent when comparing values.
            </Alert>

            {products.length === 0 && (
                <Alert severity="info">There are no products to analyze yet. Add products or import your CSV files to populate these statistics.</Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' }, gap: 2 }}>
                <MetricCard label="Products" value={formatCount(products.length)} detail="Across the full catalog" />
                <MetricCard label="Suppliers" value={formatCount(suppliers.length)} detail="Registered suppliers" color="secondary.main" />
                <MetricCard label="Units on hand" value={formatCount(stats.totalUnits)} detail="Sum of product quantities" color="info.main" />
                <MetricCard label="Estimated stock value" value={formatValue(stats.totalStockValue)} detail="Quantity × recorded unit price" color="success.main" />
                <MetricCard label="At/below minimum" value={formatCount(stats.atOrBelowMinimum)} detail="Includes out-of-stock items" color="warning.main" />
                <MetricCard label="Out of stock" value={formatCount(stats.stockCounts['Out of stock'])} detail="Products with zero quantity" color="error.main" />
            </Box>

            {stats.unpricedProducts > 0 && (
                <Alert severity="warning">
                    {formatCount(stats.unpricedProducts)} product{stats.unpricedProducts === 1 ? '' : 's'} have no unit price and are excluded from inventory value totals.
                </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                <ChartPanel title="Stock health" subtitle="Products grouped by quantity compared with their minimum stock level.">
                    {stockStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={stockStatusData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="78%" paddingAngle={3}>
                                    {stockStatusData.map(item => <Cell key={item.name} fill={stockColors[item.name]} />)}
                                </Pie>
                                <Tooltip {...chartTooltipStyle} formatter={value => [formatCount(value), 'Products']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Alert severity="info">No stock data is available yet.</Alert>
                    )}
                </ChartPanel>

                <ChartPanel title="Top products by inventory value" subtitle="The ten highest-value products across the complete catalog.">
                    {topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
                                <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
                                <XAxis type="number" tick={axisTick} tickFormatter={formatValue} />
                                <YAxis type="category" dataKey="name" tickFormatter={value => truncate(value, 26)} width={150} tick={axisTick} />
                                <Tooltip {...chartTooltipStyle} formatter={value => [formatValue(value), 'Stock value']} />
                                <Bar dataKey="value" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Alert severity="info">Add unit prices to products to compare inventory value.</Alert>
                    )}
                </ChartPanel>

                <ChartPanel title="Inventory value by supplier" subtitle="Top suppliers by the value of their linked products.">
                    {topSuppliers.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={topSuppliers} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
                                <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
                                <XAxis type="number" tick={axisTick} tickFormatter={formatValue} />
                                <YAxis type="category" dataKey="name" tickFormatter={value => truncate(value, 24)} width={150} tick={axisTick} />
                                <Tooltip {...chartTooltipStyle} formatter={value => [formatValue(value), 'Stock value']} />
                                <Bar dataKey="stockValue" fill={theme.palette.secondary.main} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Alert severity="info">No priced products are linked to suppliers yet.</Alert>
                    )}
                </ChartPanel>

                <ChartPanel title="Supplier breakdown" subtitle="Every supplier, with product counts, stock levels, and estimated value.">
                    <TableContainer sx={{ maxHeight: 320 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <SortableTableCell
                                        label="Supplier"
                                        property="name"
                                        sortBy={supplierTable.sortBy}
                                        sortDirection={supplierTable.sortDirection}
                                        onSort={supplierTable.requestSort}
                                    />
                                    <SortableTableCell
                                        label="Products"
                                        property="productCount"
                                        align="right"
                                        sortBy={supplierTable.sortBy}
                                        sortDirection={supplierTable.sortDirection}
                                        onSort={supplierTable.requestSort}
                                    />
                                    <SortableTableCell
                                        label="Units"
                                        property="units"
                                        align="right"
                                        sortBy={supplierTable.sortBy}
                                        sortDirection={supplierTable.sortDirection}
                                        onSort={supplierTable.requestSort}
                                    />
                                    <SortableTableCell
                                        label="At/below min."
                                        property="atOrBelowMinimum"
                                        align="right"
                                        sortBy={supplierTable.sortBy}
                                        sortDirection={supplierTable.sortDirection}
                                        onSort={supplierTable.requestSort}
                                    />
                                    <SortableTableCell
                                        label="Stock value"
                                        property="stockValue"
                                        align="right"
                                        sortBy={supplierTable.sortBy}
                                        sortDirection={supplierTable.sortDirection}
                                        onSort={supplierTable.requestSort}
                                    />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stats.supplierRows.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} align="center">No suppliers yet.</TableCell></TableRow>
                                ) : supplierTable.sortedRows.map(supplier => (
                                    <TableRow key={supplier.id} hover>
                                        <TableCell>
                                            <Typography variant="body2">{supplier.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {supplier.email || supplier.contactName || ' '}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{formatCount(supplier.productCount)}</TableCell>
                                        <TableCell align="right">{formatCount(supplier.units)}</TableCell>
                                        <TableCell align="right">{formatCount(supplier.atOrBelowMinimum)}</TableCell>
                                        <TableCell align="right">{formatValue(supplier.stockValue)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </ChartPanel>
            </Box>

            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    alignItems={{ xs: 'stretch', md: 'center' }}
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mb: 2 }}
                >
                    <Box>
                        <Typography variant="h6">Product details</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Search and filter every product by stock state.
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                            size="small"
                            label="Search products"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <InputLabel id="stock-status-label">Stock status</InputLabel>
                            <Select
                                labelId="stock-status-label"
                                label="Stock status"
                                value={statusFilter}
                                onChange={event => setStatusFilter(event.target.value)}
                            >
                                <MenuItem value="all">All stock states</MenuItem>
                                <MenuItem value="Out of stock">Out of stock</MenuItem>
                                <MenuItem value="Low stock">Low stock</MenuItem>
                                <MenuItem value="In stock">In stock</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>

                <Typography variant="caption" color="text.secondary">
                    Showing {formatCount(productTable.sortedRows.length)} of {formatCount(stats.productRows.length)} products, ordered by{' '}
                    {productTable.sortBy
                        ? `${productSortLabels[productTable.sortBy]} ${productTable.sortDirection === 'asc' ? 'ascending' : 'descending'}`
                        : 'stock value by default'}.
                </Typography>
                <TableContainer sx={{ mt: 1, maxHeight: 520 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <SortableTableCell
                                    label="Product"
                                    property="name"
                                    sortBy={productTable.sortBy}
                                    sortDirection={productTable.sortDirection}
                                    onSort={productTable.requestSort}
                                />
                                <SortableTableCell
                                    label="Supplier"
                                    property="supplierName"
                                    sortBy={productTable.sortBy}
                                    sortDirection={productTable.sortDirection}
                                    onSort={productTable.requestSort}
                                />
                                <SortableTableCell
                                    label="Quantity / minimum"
                                    property="quantity"
                                    align="right"
                                    sortBy={productTable.sortBy}
                                    sortDirection={productTable.sortDirection}
                                    onSort={productTable.requestSort}
                                />
                                <SortableTableCell
                                    label="Unit price"
                                    property="unitPrice"
                                    align="right"
                                    sortBy={productTable.sortBy}
                                    sortDirection={productTable.sortDirection}
                                    onSort={productTable.requestSort}
                                />
                                <SortableTableCell
                                    label="Stock value"
                                    property="value"
                                    align="right"
                                    sortBy={productTable.sortBy}
                                    sortDirection={productTable.sortDirection}
                                    onSort={productTable.requestSort}
                                />
                                <SortableTableCell
                                    label="Stock status"
                                    property="status"
                                    sortBy={productTable.sortBy}
                                    sortDirection={productTable.sortDirection}
                                    onSort={productTable.requestSort}
                                />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        No products match the selected search and stock status.
                                    </TableCell>
                                </TableRow>
                            ) : productTable.sortedRows.map(product => (
                                <TableRow key={product.id} hover>
                                    <TableCell>
                                        <Typography variant="body2">{product.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{product.sku || 'No SKU'}</Typography>
                                    </TableCell>
                                    <TableCell>{product.supplierName}</TableCell>
                                    <TableCell align="right">{formatCount(product.quantity)} / {formatCount(product.minimum)}</TableCell>
                                    <TableCell align="right">{product.unitPrice === null ? '—' : formatValue(product.unitPrice)}</TableCell>
                                    <TableCell align="right">{product.value === null ? '—' : formatValue(product.value)}</TableCell>
                                    <TableCell>
                                        <Chip size="small" label={product.status} color={statusColor[product.status]} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Stack>
    );
};

export default Statistics;
