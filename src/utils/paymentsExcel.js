import * as XLSX from "xlsx";

export const exportToExcelFormat = (
  tickets,
  startDate,
  endDate,
  searchQuery,
) => {
  if (tickets.length === 0) return;
  const flatSheetData = tickets.map((t, index) => ({
    "R.No.": t.receiptNumber || index + 1,
    "Date & Time": new Date(t.createdAt).toLocaleString("en-IN"),
    Name: t.customer.name,
    "Payment Mode": t.paymentMode,
    "Ref.No.": t.referenceNo || "",
    Amount: t.amountPaid,
    Remark: t.remark || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(flatSheetData);
  const workbook = XLSX.utils.book_new();
  worksheet["!cols"] = [
    { wch: 8 }, //receipt
    { wch: 22 }, //date
    { wch: 20 }, //name
    { wch: 15 }, //payment mode
    { wch: 30 }, //ref. no.
    { wch: 10 }, //amount
    { wch: 30 }, //remark
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Ledger");

  const fileStartLabel = startDate || "Start";
  const fileEndLabel = endDate || "End";

  const searchLabel = searchQuery?.trim()
    ? `_${searchQuery.trim().replace(/[<>:"/\\|?*]+/g, "_")}`
    : "";

  XLSX.writeFile(
    workbook,
    `Payments_Ledger${searchLabel}_${fileStartLabel}_to_${fileEndLabel}.xlsx`,
  );
};
