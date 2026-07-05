import * as XLSX from "xlsx";

export const exportToExcelFormat = (
  tickets,
  startDate,
  endDate,
  searchQuery,
) => {
  if (tickets.length === 0) return;
  const flatSheetData = tickets.map((t, index) => ({
    "S No.": t.receiptNumber || index + 1,
    "Date & Time": new Date(t.createdAt).toLocaleString("en-IN"),
    Name: t.customerName,
    "V No.": t.vehicleNumber.toUpperCase(),
    Site: t.site,
    Material: t.material?.name || "undefined",
    Quantity: t.quantity,
    Rate: t.rateApplied,
    Payment: t.paymentType,
    Balance: t.totalAmount,
  }));

  const worksheet = XLSX.utils.json_to_sheet(flatSheetData);
  const workbook = XLSX.utils.book_new();
  worksheet["!cols"] = [
    { wch: 8 }, //receipt
    { wch: 22 }, //date
    { wch: 15 }, //name
    { wch: 14 }, //vehicle
    { wch: 15 }, //site
    { wch: 12 }, //material
    { wch: 10 }, //quantity
    { wch: 10 }, //rate
    { wch: 10 }, //payment
    { wch: 10 }, //balance
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Weighbridge Ledger");

  const fileStartLabel = startDate || "Start";
  const fileEndLabel = endDate || "End";

  const searchLabel = searchQuery?.trim()
    ? `_${searchQuery.trim().replace(/[<>:"/\\|?*]+/g, "_")}`
    : "";

  XLSX.writeFile(
    workbook,
    `Mandar_Crusher_Ledger${searchLabel}_${fileStartLabel}_to_${fileEndLabel}.xlsx`,
  );
};
