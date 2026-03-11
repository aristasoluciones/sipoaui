import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useNotification } from '@/layout/context/notificationContext';
import { PreciosService } from '@/src/services/precios.service';

interface ImportPreciosDialogProps {
    visible: boolean;
    onHide: () => void;
    onRefresh: () => void;
}

interface ImportPreviewRow {
    rowNumber: number;
    fileRowNumber: number;
    values: string[];
}

interface SheetPreview {
    name: string;
    headers: string[];
    fields: string[];
    rows: ImportPreviewRow[];
}

const normalizeText = (t: string) =>
    t
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .replace(/_/g, '');

const ImportPreciosDialog: React.FC<ImportPreciosDialogProps> = ({ visible, onHide, onRefresh }) => {
    const { success: showMsgSuccess, error: showMsgError } = useNotification();
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [sheetPreviews, setSheetPreviews] = useState<SheetPreview[]>([]);
    const [activeSheetIdx, setActiveSheetIdx] = useState(0);
    const [structureError, setStructureError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setImportFile(null);
        setSheetPreviews([]);
        setActiveSheetIdx(0);
        setStructureError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleHide = () => {
        resetState();
        onHide();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
            loadPreviewFromFile(file);
        }
    };

    const loadPreviewFromFile = async (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'xlsx' && extension !== 'xls') {
            setStructureError('Solo se permiten archivos Excel (.xlsx, .xls) para este importador.');
            return;
        }

        try {
            const XLSX = await import('xlsx');
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            let detectedSheets: SheetPreview[] = [];

            workbook.SheetNames.forEach((sheetName) => {
                if (sheetName.toLowerCase().includes('instrucciones')) return;
                const sheet = workbook.Sheets[sheetName];
                const sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

                // Procesar Merges (Celdas combinadas)
                if (sheet['!merges']) {
                    sheet['!merges'].forEach((merge: any) => {
                        const firstCellVal = sheetRows[merge.s.r]?.[merge.s.c];
                        if (firstCellVal !== undefined && firstCellVal !== '') {
                            for (let r = merge.s.r; r <= merge.e.r; r++) {
                                for (let c = merge.s.c; c <= merge.e.c; c++) {
                                    if (sheetRows[r]) sheetRows[r][c] = firstCellVal;
                                }
                            }
                        }
                    });
                }

                const normalizedRows = sheetRows.map((row) => row.map((cell) => String(cell ?? '').trim()));
                if (normalizedRows.length === 0) return;

                let currentPartidaName = sheetName;
                let currentPartidaCode = '';
                const sheetCodeMatch = sheetName.match(/\d{5}/);
                if (sheetCodeMatch) {
                    currentPartidaCode = sheetCodeMatch[0];
                    // Limpiar "COSTOS", "IEPC", años, paréntesis y el código
                    currentPartidaName =
                        sheetName
                            .replace(/\uFFFD/g, 'Í')
                            .replace(/PAPELER\?A/i, 'PAPELERÍA')
                            .replace(currentPartidaCode, '')
                            .replace(/[()]/g, '')
                            .replace(/^costos?\s+/i, '')
                            .replace(/\bIEPC\b/gi, '')
                            .replace(/\b20\d{2}\b/g, '')
                            .trim()
                            .replace(/\s+/g, ' ') || sheetName;
                }

                let currentHeaders: string[] = [];
                let currentFields: string[] = [];
                let currentRows: ImportPreviewRow[] = [];
                let vIdxs: number[] = [];

                normalizedRows.forEach((row, rIdx) => {
                    if (row.every((c) => c === '')) return;

                    const rowText = row.join(' ').toLowerCase();
                    const nRowText = normalizeText(rowText);

                    const isPartidaHeaderLabel = nRowText.includes('partidapresupuestaria') || nRowText.includes('costos');
                    const isPartidaCodeRow = row.some((cell) => /^\d{5}$/.test(String(cell || '').trim()));
                    const isColumnHeader = row.some((c) => {
                        const n = normalizeText(c);
                        const cleanN = n.replace(/[^a-z0-9]/g, '');
                        return n.includes('concepto') || cleanN.includes('concepto') || n === 'total' || n.includes('costototal');
                    });

                    if (isPartidaHeaderLabel || isPartidaCodeRow || isColumnHeader) {
                        if (currentRows.length > 0) {
                            const name = currentPartidaCode ? `${currentPartidaName} (${currentPartidaCode})` : currentPartidaName;
                            detectedSheets.push({ name, headers: currentHeaders, fields: currentFields, rows: [...currentRows] });
                            currentRows = [];
                        }
                    }

                    if (isPartidaCodeRow) {
                        const codeIdx = row.findIndex((cell) => /^\d{5}$/.test(String(cell || '').trim()));
                        currentPartidaCode = row[codeIdx];
                        currentPartidaName = row.find((c, i) => i !== codeIdx && String(c).length > 2) || currentPartidaName;
                    } else if (isPartidaHeaderLabel) {
                        const nextR = normalizedRows[rIdx + 1];
                        const codeIdx = nextR ? nextR.findIndex((cell) => /^\d{5}$/.test(String(cell || '').trim())) : -1;
                        if (codeIdx !== -1) {
                            currentPartidaCode = nextR[codeIdx];
                            currentPartidaName = nextR.find((c, i) => i !== codeIdx && String(c).length > 2) || currentPartidaName;
                        }
                    }

                    if (isColumnHeader) {
                        vIdxs = row.map((c, i) => (c !== '' ? i : -1)).filter((i) => i !== -1);
                        currentHeaders = vIdxs.map((i) => row[i]);
                        currentFields = vIdxs.map((i) => {
                            const n = normalizeText(row[i]);
                            if (n.includes('codigo') || n.includes('clave') || (n.includes('partida') && !n.includes('presupuestaria'))) return 'partida_codigo';
                            if (n.includes('nombre') || n.includes('concepto')) return 'concepto';
                            if (n.includes('unidad')) return 'unidad_medida';
                            if (n.includes('precio') || n.includes('costototal') || n === 'total') return 'costo_total';
                            if (n.includes('costo') || n.includes('pieza')) return 'costo_pieza';
                            if (n.includes('iva') || n.includes('16')) return 'iva_monto';
                            if (n.includes('inflacion')) return 'inflacion';
                            if (n.includes('contenido') || n.includes('pza')) return 'contenido';
                            return '';
                        });
                    }

                    if (currentHeaders.length > 0 && !isColumnHeader && !isPartidaHeaderLabel) {
                        const values = vIdxs.map((i) => String(row[i] || '').trim());

                        const isNotTitleRow = !values.some((v) => {
                            const upperV = v.toUpperCase();
                            const cleanV = upperV.replace(/[^A-Z]/g, '');
                            return cleanV === 'ORIGINAL' || upperV.includes('INSTITUTO DE ELECCIONES Y PARTICIPACIÓN');
                        });

                        const isNotHeaderAgain = !values.some((v) => {
                            const cleanV = normalizeText(v).replace(/[^a-z]/g, '');
                            return cleanV.includes('concepto');
                        });

                        const isNotPartidaRepeat = !/^\d{5}$/.test(values[0]);
                        const hasRealData = values.some((v) => v !== '' && v !== '-');

                        const priceIdx = currentFields.findIndex((f) => f === 'costo_pieza' || f === 'costo_total');
                        let hasPriceValid = true;
                        if (priceIdx !== -1) {
                            const priceVal = values[priceIdx];
                            if (priceVal && priceVal !== '-') {
                                const parsed = parseFloat(priceVal.replace(/[^0-9.-]+/g, ''));
                                hasPriceValid = !isNaN(parsed) && parsed > 0;
                            } else {
                                hasPriceValid = false;
                            }
                        }

                        if (hasRealData && isNotHeaderAgain && isNotPartidaRepeat && isNotTitleRow && hasPriceValid) {
                            currentRows.push({ rowNumber: currentRows.length + 1, fileRowNumber: rIdx + 1, values });
                        }
                    }
                });

                if (currentRows.length > 0) {
                    const name = currentPartidaCode ? `${currentPartidaName}(${currentPartidaCode})` : currentPartidaName;
                    detectedSheets.push({ name, headers: currentHeaders, fields: currentFields, rows: currentRows });
                }
            });

            if (detectedSheets.length === 0) {
                setStructureError('No se detectaron partidas o encabezados de precios válidos en el archivo.');
            } else {
                setSheetPreviews(detectedSheets);
                setStructureError(null);
            }
        } catch (error) {
            console.error('Error parsing excel:', error);
            setStructureError('Error al procesar el archivo Excel.');
        }
    };

    const executeImport = async () => {
        if (!importFile) return;
        setImporting(true);
        try {
            const result = await PreciosService.import(importFile);
            showMsgSuccess(`Se importaron ${result.total_created} registros nuevos y se actualizaron ${result.total_updated}.`);
            onRefresh();
            handleHide();
        } catch (err: any) {
            showMsgError(err.message || 'Error al importar los datos');
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog
            visible={visible}
            style={{ width: '900px' }}
            header="Importar Catálogo de Precios y Tarifas"
            modal
            onHide={handleHide}
            onShow={resetState}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Cerrar" icon="pi pi-times" severity="secondary" outlined onClick={handleHide} disabled={importing} />
                    <Button label="Importar Todo" icon="pi pi-check" onClick={executeImport} loading={importing} disabled={!!(!importFile || importing || structureError)} />
                </div>
            }
        >
            <div className="flex flex-column gap-3">
                <p className="m-0 text-600">Sube el tabulador de precios oficial. El sistema agrupará los datos automáticamente por Partida Presupuestaria.</p>
                <div className="flex gap-2 align-items-center">
                    <input ref={fileInputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileChange} />
                    <Button label={importFile ? 'Cambiar archivo' : 'Elegir archivo'} icon="pi pi-file" onClick={() => fileInputRef.current?.click()} disabled={importing} className="p-button-outlined" />
                    <small className="text-700 font-medium">{importFile ? importFile.name : 'No hay archivo seleccionado'}</small>
                </div>

                {structureError && (
                    <div className="bg-red-50 border-left-3 border-red-500 p-3 flex align-items-center gap-3 border-round">
                        <i className="pi pi-exclamation-triangle text-red-600 text-xl"></i>
                        <span className="text-red-800 font-medium">{structureError}</span>
                    </div>
                )}

                {sheetPreviews.length > 0 && (
                    <div className="flex flex-column gap-2 mt-2">
                        <div className="flex gap-1 bg-gray-100 p-1 border-round-lg w-full overflow-x-auto no-scrollbar">
                            {sheetPreviews.map((sheet, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveSheetIdx(idx)}
                                    className={`px-4 py-2 border-none border-round-md cursor-pointer font-medium transition-all text-sm white-space-nowrap ${
                                        activeSheetIdx === idx ? 'bg-white text-blue-700 shadow-1' : 'bg-transparent text-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <i className="pi pi-file-excel mr-2"></i>
                                    {sheet.name}
                                </button>
                            ))}
                        </div>
                        <div className="border-1 surface-border border-round-xl p-0 overflow-hidden">
                            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                                <table className="w-full text-sm border-collapse">
                                    <thead className="sticky top-0 z-1 shadow-1 bg-gray-50">
                                        <tr>
                                            <th className="text-left p-2 border-bottom-1 surface-border w-4rem text-700">Fila</th>
                                            {sheetPreviews[activeSheetIdx].headers.map((h, i) => (
                                                <th key={i} className="text-left p-2 border-bottom-1 surface-border min-w-8rem text-700">
                                                    {h || `Col ${i + 1}`}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sheetPreviews[activeSheetIdx].rows.slice(0, 50).map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-blue-50 transition-colors border-bottom-1 surface-border">
                                                <td className="p-2 font-medium text-400 bg-gray-50">{row.fileRowNumber}</td>
                                                {row.values.map((v, cIdx) => (
                                                    <td key={cIdx} className="p-2 text-800">
                                                        {v}
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
            </div>
        </Dialog>
    );
};

export default ImportPreciosDialog;
