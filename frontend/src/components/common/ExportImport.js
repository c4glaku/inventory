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
        try {
            console.log(`Attempting ${format} export for type: ${type}`); // Debugging
            console.log('API URL:', `/export/${format}/${type}`);     // Debugging
            setError(null);
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
            console.error('Export error:', error);
            setError('Export failed. Please try again');
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
        window.URL.revokeObjectURL(url);
    };

    const handleImport = async (event) => {
        const file = event.taget.files[0];
        if (!file) return;

        setImporting(true);
        setError(null);

        try {
            if (file.type === 'applicaiton/json') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        await api.post(`/import/json/${type}`, { data });
                        onImportSuccess();
                        setImportDialogOpen(false);
                    } catch (error) {
                        console.error('JSON import error:', error);
                        setError('Invalid JSON file or import failed');
                    } finally {
                        setImporting(false);
                    }
                };
                reader.readAsText(file);
            } else if (file.type === 'text/csv') {
                const formData = new FormData();
                formData.append('file', file);
                await api.post(`/import/csv/${type}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                onImportSuccess();
                setImportDialogOpen(false);
            } else {
                setError('Invalid file format');
            }
        } catch (error) {
            console.error('Import error:', error);
            setError('Import failed. Please try again');
        } finally {
            setImporting(false);
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