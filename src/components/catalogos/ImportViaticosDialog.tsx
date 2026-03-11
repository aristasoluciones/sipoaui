'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useNotification } from '@/layout/context/notificationContext';
import { formatApiError } from '@/src/utils';
import http from '@/src/lib/axios';

/**
 * Interfaces para el resultado de importación
 */
export interface ImportErrorItem {
    row?: number | string;
    field?: string;
    message?: string;
    [key: string]: any;
}

export interface ImportResult {
    totalCreated: number;
    totalUpdated: number;
    totalErrors: number;
    errors: ImportErrorItem[];
    details?: {
        [key: string]: {
            total_created: number;
            total_updated: number;
            total_errors: number;
            total_success: number;
        };
    };
}

export interface ImportPreviewRow {
    rowNumber: number;
    fileRowNumber: number;
    backendRowNumber?: number;
    values: string[];
}

interface ImportViaticosDialogProps {
    visible: boolean;
    onHide: () => void;
    onRefresh?: () => Promise<void>;
}

const normalizeText = (t: string) =>
    t
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const ImportViaticosDialog: React.FC<ImportViaticosDialogProps> = ({ visible, onHide, onRefresh }) => {
    const { success: showMsgSuccess, error: showMsgError } = useNotification();

    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    // Estados para previsualización dual (Viáticos y Municipios)
    const [muniHeaders, setMuniHeaders] = useState<string[]>([]);
    const [muniFields, setMuniFields] = useState<string[]>([]);
    const [muniRows, setMuniRows] = useState<ImportPreviewRow[]>([]);

    const [viaticoHeaders, setViaticoHeaders] = useState<string[]>([]);
    const [viaticoFields, setViaticoFields] = useState<string[]>([]);
    const [viaticoRows, setViaticoRows] = useState<ImportPreviewRow[]>([]);

    const [activeTab, setActiveTab] = useState<'municipios' | 'viaticos'>('viaticos');
    const [structureError, setStructureError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setImportFile(null);
        setMuniHeaders([]);
        setMuniFields([]);
        setMuniRows([]);
        setViaticoHeaders([]);
        setViaticoFields([]);
        setViaticoRows([]);
        setImportResult(null);
        setImporting(false);
        setStructureError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleHide = () => {
        if (importing) return;
        onHide();
    };

    const parseCsvRow = (line: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const next = line[i + 1];
            if (char === '"' && inQuotes && next === '"') {
                current += '"';
                i++;
                continue;
            }
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        result.push(current.trim());
        return result;
    };

    const loadPreviewFromFile = async (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        let rows: string[][] = [];

        try {
            let technicalMerges: any[] = [];
            if (extension === 'xlsx' || extension === 'xls') {
                const XLSX = await import('xlsx');
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const firstSheet = workbook.Sheets[firstSheetName];

                technicalMerges = firstSheet['!merges'] || [];
                rows = (XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][]).map((row) => row.map((cell) => String(cell ?? '').trim()));

                technicalMerges.forEach((merge) => {
                    const firstVal = rows[merge.s.r]?.[merge.s.c] || '';
                    if (firstVal !== '') {
                        for (let r = merge.s.r; r <= merge.e.r; r++) {
                            for (let c = merge.s.c; c <= merge.e.c; c++) {
                                if (r === merge.s.r && c === merge.s.c) continue;
                                if (rows[r] && rows[r][c] === '') {
                                    rows[r][c] = firstVal;
                                }
                            }
                        }
                    }
                });
            } else {
                const content = await file.text();
                rows = content
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => parseCsvRow(line));
            }

            if (!rows.length) return;

            // Municipios Detection
            const muniKeywords = ['zona', 'fuera', 'exterior', 'chiapas', 'estado', 'marginacion', 'muy alto', 'alto', 'medio', 'bajo'];
            const nMuniKeywords = muniKeywords.map(normalizeText);
            let muniHeaderIdx = -1;
            let muniMatches = -1;

            for (let i = 0; i < Math.min(rows.length, 200); i++) {
                const row = rows[i];
                let keywordsWeight = 0;
                let actualNamesBelow = 0;

                row.forEach((cell, colIdx) => {
                    const val = normalizeText(String(cell || ''));
                    if (val.includes('zona') || val.includes('fuera') || val.includes('exterior')) {
                        keywordsWeight += 5;
                        for (let r = i + 1; r < Math.min(rows.length, i + 8); r++) {
                            const cVal = String(rows[r]?.[colIdx] || '').trim();
                            if (cVal === '' || cVal === '-') continue;
                            const isPrice = /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(cVal) || /^\d+(\.\d+)?$/.test(cVal);
                            if (!isPrice && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/.test(cVal)) {
                                actualNamesBelow += 2;
                            } else if (isPrice) {
                                actualNamesBelow -= 10;
                            }
                        }
                    }
                });

                const totalScore = keywordsWeight + actualNamesBelow;
                if (totalScore > muniMatches && totalScore > 0) {
                    muniMatches = totalScore;
                    muniHeaderIdx = i;
                }
            }

            // Viáticos Detection
            const viaticoKeywords = ['nivel', 'categoria', 'cuota', 'internacional'];
            const nViaticoKeywords = viaticoKeywords.map(normalizeText);
            let viaticoHeaderIdx = -1;
            let viaticoMatches = -1;

            for (let i = 0; i < Math.min(rows.length, 50); i++) {
                const row = rows[i];
                let vMatch = 0;
                row.forEach((cell) => {
                    const val = normalizeText(String(cell || ''));
                    if (nViaticoKeywords.some((kw) => val.includes(kw))) vMatch++;
                });
                if (vMatch > viaticoMatches) {
                    viaticoMatches = vMatch;
                    viaticoHeaderIdx = i;
                }
            }

            // Process Municipios
            if (muniMatches > 0) {
                const realHeaderIdx = muniHeaderIdx;
                const detRow = rows[realHeaderIdx];
                const validIndices: number[] = [];
                detRow.forEach((h, colIdx) => {
                    const val = String(h || '').trim();
                    const nVal = normalizeText(val);
                    if (val === '' || (!nMuniKeywords.some((kw) => nVal.includes(kw)) && !nVal.includes('zona'))) return;
                    validIndices.push(colIdx);
                });

                setMuniHeaders(validIndices.map((idx) => detRow[idx]));
                setMuniFields(validIndices.map(() => 'nombre'));
                setMuniRows(
                    rows
                        .slice(realHeaderIdx + 1)
                        .map((row, idx) => ({
                            rowNumber: idx + 1,
                            fileRowNumber: realHeaderIdx + idx + 2,
                            values: validIndices.map((cIdx) => String(row[cIdx] || '').trim())
                        }))
                        .filter((r) => r.values.some((v) => v.trim() !== '' && v.trim() !== '-'))
                );
            }

            // Process Viáticos
            if (viaticoMatches > 0) {
                const detRow = rows[viaticoHeaderIdx];
                const validIndices: number[] = [];
                detRow.forEach((h, colIdx) => {
                    const val = String(h || '').trim();
                    const nVal = normalizeText(val);
                    if (val !== '' && (nViaticoKeywords.some((kw) => nVal.includes(kw)) || nVal.includes('zona') || nVal.includes('fuera'))) {
                        validIndices.push(colIdx);
                    }
                });

                setViaticoHeaders(validIndices.map((idx) => detRow[idx]));
                setViaticoFields(
                    validIndices.map((idx) => {
                        const n = normalizeText(detRow[idx]);
                        if (n.includes('categoria')) return 'categoria';
                        if (n.includes('nivel')) return 'nivel';
                        if (n.includes('zona') && n.includes('1')) return 'zona1';
                        if (n.includes('zona') && n.includes('2')) return 'zona2';
                        if (n.includes('zona') && n.includes('3')) return 'zona3';
                        if (n.includes('fuera')) return 'cuota_fuera_estado';
                        if (n.includes('internacional')) return 'cuota_internacional';
                        return '';
                    })
                );
                setViaticoRows(
                    rows
                        .slice(viaticoHeaderIdx + 1)
                        .map((row, idx) => ({
                            rowNumber: idx + 1,
                            fileRowNumber: viaticoHeaderIdx + idx + 2,
                            values: validIndices.map((cIdx) => String(row[cIdx] || '').trim())
                        }))
                        .filter((r) => r.values.some((v) => v !== '' && v !== '-'))
                );
            }

            if (viaticoMatches > 0) setActiveTab('viaticos');
            else if (muniMatches > 0) setActiveTab('municipios');
        } catch (error) {
            console.error('Error parsing file preview:', error);
            showMsgError('No se pudo generar la vista previa');
        }
    };

    const normalizeImportResult = (payload: any): ImportResult => {
        const extractRow = (message: string): number | undefined => {
            const match = message.match(/(?:fila|row|linea|line)\s*[:#-]?\s*(\d+)/i);
            return match ? Number(match[1]) : undefined;
        };
        const totalCreated = Number(payload?.total_created ?? payload?.totalCreated ?? 0);
        const totalUpdated = Number(payload?.total_updated ?? payload?.totalUpdated ?? 0);
        const totalErrors = Number(payload?.total_errors ?? payload?.totalErrors ?? 0);
        const rawErrors = payload?.data?.errors ?? payload?.errors;

        let errors: ImportErrorItem[] = [];
        if (Array.isArray(rawErrors)) {
            errors = rawErrors.map((item: any) => {
                if (typeof item === 'string') return { row: extractRow(item), message: item };
                const message = item?.message ?? item?.error ?? '';
                const r = item?.row ?? item?.fila ?? item?.line;
                return { row: Number.isFinite(Number(r)) ? Number(r) : extractRow(String(message)), field: item?.field, message };
            });
        }
        return { totalCreated, totalUpdated, totalErrors, errors, details: payload?.data?.details };
    };

    const executeImport = async () => {
        if (!importFile) return;
        const formData = new FormData();
        formData.append('archivo', importFile);
        formData.append('catalogo', 'viaticos');
        try {
            setImporting(true);
            const response = await http.post('/api/catalogos/importar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const result = normalizeImportResult(response?.data ?? {});
            setImportResult(result);
            if (onRefresh) await onRefresh();
            if (result.totalErrors > 0) showMsgError(`Importación con errores. Éxitos: ${result.totalCreated + result.totalUpdated}, Errores: ${result.totalErrors}`);
            else showMsgSuccess(`Importación exitosa. Se procesaron ${result.totalCreated + result.totalUpdated} registros.`);
        } catch (error: any) {
            setImportResult(normalizeImportResult(error?.response?.data ?? {}));
            showMsgError(formatApiError(error) || 'Error en la importación');
        } finally {
            setImporting(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setImportResult(null);
        setImportFile(file);
        await loadPreviewFromFile(file);
    };

    const mappedErrorRows = new Set((importResult?.errors || []).map((e) => Number(e.row)));

    return (
        <Dialog
            visible={visible}
            style={{ width: '1000px' }}
            header="Importar Catálogo de Viáticos y Municipios"
            modal
            onHide={handleHide}
            onShow={resetState}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Cerrar" icon="pi pi-times" severity="secondary" outlined onClick={handleHide} disabled={importing} />
                    <Button label="Importar" icon="pi pi-check" onClick={executeImport} loading={importing} disabled={!importFile || importing} />
                </div>
            }
        >
            <div className="flex flex-column gap-3">
                <p className="m-0 text-600">Sube el archivo Excel del tabulador oficial de viáticos para actualizar cuotas y municipios.</p>

                <div className="flex gap-2 align-items-center">
                    <input ref={fileInputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileChange} />
                    <Button label={importFile ? 'Cambiar archivo' : 'Elegir archivo'} icon="pi pi-file" onClick={() => fileInputRef.current?.click()} disabled={importing} className="p-button-outlined" />
                    <small className="text-700 font-medium">{importFile ? importFile.name : 'No hay archivo seleccionado'}</small>
                </div>

                {(muniRows.length > 0 || viaticoRows.length > 0) && (
                    <div className="flex flex-column gap-2 mt-2">
                        <div className="flex gap-1 bg-gray-100 p-1 border-round-lg w-fit">
                            <button
                                onClick={() => setActiveTab('viaticos')}
                                className={`px-3 py-1 border-none border-round-md cursor-pointer font-medium transition-all text-sm ${activeTab === 'viaticos' ? 'bg-white text-blue-700 shadow-1' : 'bg-transparent text-600 hover:bg-gray-200'}`}
                            >
                                Cuotas de Viáticos
                            </button>
                            <button
                                onClick={() => setActiveTab('municipios')}
                                className={`px-3 py-1 border-none border-round-md cursor-pointer font-medium transition-all text-sm ${activeTab === 'municipios' ? 'bg-white text-blue-700 shadow-1' : 'bg-transparent text-600 hover:bg-gray-200'}`}
                            >
                                Municipios (Zonas)
                            </button>
                        </div>

                        <div className="border-1 surface-border border-round-xl p-0 overflow-hidden">
                            <div className="overflow-auto" style={{ maxHeight: '350px' }}>
                                <table className="w-full text-sm border-collapse">
                                    <thead className="sticky top-0 z-1 bg-gray-50 shadow-1">
                                        <tr>
                                            <th className="text-left p-2 border-bottom-1 surface-border w-4rem text-700">Fila</th>
                                            {(activeTab === 'viaticos' ? viaticoHeaders : muniHeaders).map((h, i) => (
                                                <th key={i} className="text-left p-2 border-bottom-1 surface-border min-w-8rem text-700">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(activeTab === 'viaticos' ? viaticoRows : muniRows).slice(0, 50).map((row) => (
                                            <tr key={row.fileRowNumber} className={mappedErrorRows.has(row.fileRowNumber) ? 'bg-red-50' : ''}>
                                                <td className="p-2 border-bottom-1 surface-border text-xs font-bold text-700">{row.fileRowNumber}</td>
                                                {row.values.map((v, i) => (
                                                    <td key={i} className="p-2 border-bottom-1 surface-border">
                                                        {v || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {importResult && (
                    <div className="mt-3">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Tag severity="success" value={`${importResult.totalCreated} creados`} />
                            <Tag severity="info" value={`${importResult.totalUpdated} actualizados`} />
                            <Tag severity={importResult.totalErrors > 0 ? 'danger' : undefined} value={`${importResult.totalErrors} errores`} />
                        </div>
                        {importResult.errors.length > 0 && (
                            <div className="max-h-12rem overflow-auto mt-2 border-1 surface-border border-round bg-gray-50 p-3">
                                {importResult.errors.map((e, i) => (
                                    <div key={i} className="text-xs mb-1 flex gap-2">
                                        <span className="font-bold text-red-600 w-4rem">Fila {e.row || '?'}:</span>
                                        <span className="text-600">{e.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default ImportViaticosDialog;
