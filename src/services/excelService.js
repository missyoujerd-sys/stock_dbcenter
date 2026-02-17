import * as XLSX from 'xlsx';

export const generateExcelFile = (stockData) => {
    // Format data for Excel
    const excelData = stockData.map(item => ({
        'วันที่': item.dateReceived,
        'จากที่ไหน': item.source,
        'ถึงที่ไหน': item.destination,
        'ชื่อสินค้า': item.itemName,
        'จำนวน': item.quantity,
        'สถานะ': item.status
    }));

    // Create a new workbook and add the data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths (optional but good for readability)
    const wscols = [
        { wch: 15 }, // Date
        { wch: 20 }, // Source
        { wch: 20 }, // Destination
        { wch: 30 }, // Item Name
        { wch: 10 }, // Quantity
        { wch: 15 }  // Status
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');

    // Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `stock_dispatch_${dateStr}.xlsx`;

    // Write file and trigger download
    XLSX.writeFile(wb, fileName);
};
