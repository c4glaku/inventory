import React, { useState } from 'react';    
import { 
    Button,
    ButtonGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Box
} from '@mui/material';
import { Upload, Download } from '@mui/icons-material';
import api from '../../api/axios';

const ExportImport = ({ type, onImportSuccess }) => {
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const handleExport = async (format) => {
        setError(null);
        try {
            if (format === 'json') {
                const response = await api.get(`/export/json/${type}`);
                const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                    type: 'application/json'
                });
                downloadFile(blob, `${type}.json`);
            } else if (format === 'csv') {
                const response = await api.get(`/export/csv/${type}`, {
                    responseType: 'blob'
                });
                downloadFile(response.data, `${type}.csv`);
            } 
        } catch (error) {
            setError(error.response?.data?.error || error.response?.data?.message || 'Export failed. Please try again');
        }
    };

    const downloadFile = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    };

    const handleImport = async (event) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        if (!file) return;
    
        setImporting(true);
        setError(null);
    
        try {
            const extension = file.name.toLowerCase().split('.').pop();
            if (extension === 'json') {
                if (file.size > 2 * 1024 * 1024) throw new Error('JSON files must be 2 MB or smaller.');
                const data = JSON.parse(await file.text());
                await api.post(`/import/json/${type}`, { data });
                onImportSuccess();
                setImportDialogOpen(false);
            } else if (extension === 'csv') {
                if (file.size > 10 * 1024 * 1024) throw new Error('CSV files must be 10 MB or smaller.');
                const formData = new FormData();
                formData.append('file', file);
                await api.post(`/import/csv/${type}`, formData);
                onImportSuccess();
                setImportDialogOpen(false);
            } else {
                setError('Invalid file format');
            }
        } catch (error) {
            setError(error.response?.data?.error || error.response?.data?.message || error.message || 'Import failed. Please try again');
        } finally {
            setImporting(false);
            input.value = '';
        }
    };

    return (
        <>
            <ButtonGroup variant="contained" sx={{ mb: 2 }}>
                <Button
                    startIcon={<Download />}
                    onClick={() => handleExport('json')}
                >
                    Export JSON
                </Button>
                <Button
                    startIcon={<Download />}
                    onClick={() => handleExport('csv')}
                >
                    Export CSV
                </Button>
                <Button
                    startIcon={<Upload />}
                    onClick={() => setImportDialogOpen(true)}
                >
                    Import
                </Button>
            </ButtonGroup>

            <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
                <DialogTitle>Import {type}</DialogTitle>
                <DialogContent>
                    <Box sx={{ minWidth: 300, p: 2 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        {importing ? (
                            <CircularProgress />
                        ) : (
                            <input
                                type="file"
                                accept=".json,.csv"
                                onChange={handleImport}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialogOpen(false)}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ExportImport;
