import * as XLSX from "xlsx";

export const exportToExcelFormat = (tickets, startDate, endDate) => {
  if (tickets.length === 0) return;
  const flatSheetData = tickets.map((t, index) => ({
    "Receipt No": t.receiptNumber || index + 1,
    "Date & Time Logged": new Date(t.createdAt).toLocaleString("en-IN"),
    "Vehicle Plate Number": t.vehicleNumber.toUpperCase(),
    "Customer / Vendor": t.customerName,
    "Material Variant": t.material?.name || "Aggregates Row",
    "Gross Weight (KG)": t.grossWeight,
    "Tare Weight (KG)": t.tareWeight,
    "Net Weight (KG)": t.netWeight,
    "Rate (INR/Ton)": t.rateApplied,
    "Total Invoiced Bill (INR)": t.totalAmount,
    "Cabin Clerk": t.clerk?.name || "System Clerk",
  }));

  const worksheet = XLSX.utils.json_to_sheet(flatSheetData);
  const workbook = XLSX.utils.book_new();
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 22 },
    { wch: 26 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Weighbridge Ledger");

  const fileStartLabel = startDate || "Start";
  const fileEndLabel = endDate || "End";

  XLSX.writeFile(
    workbook,
    `Mandar_Crusher_Ledger_${fileStartLabel}_to_${fileEndLabel}.xlsx`,
  );
};
