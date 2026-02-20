// Export utility for downloading reports

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Column definitions [{key: 'fieldName', label: 'Display Label'}]
 */
export const exportToCSV = (data, filename, columns) => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // Create header row
    const header = columns.map(col => col.label).join(',');

    // Create data rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value = item[col.key] || '';
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });

    // Combine header and rows
    const csvContent = [header, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Export data to Excel-compatible file (XLSX format via CSV)
 * For a true XLSX, the xlsx library would be needed
 */
export const exportToExcel = (sheets, filename) => {
    // For each sheet, create a CSV section
    let content = '';

    sheets.forEach((sheet, index) => {
        if (index > 0) content += '\n\n';
        content += `=== ${sheet.name} ===\n`;

        // Header
        content += sheet.columns.map(col => col.label).join('\t') + '\n';

        // Data rows
        sheet.data.forEach(item => {
            const row = sheet.columns.map(col => {
                let value = item[col.key] || '';
                return value;
            }).join('\t');
            content += row + '\n';
        });
    });

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Format date for export
 */
export const formatDateForExport = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Format currency for export
 */
export const formatCurrencyForExport = (amount) => {
    return parseFloat(amount).toFixed(2);
};
