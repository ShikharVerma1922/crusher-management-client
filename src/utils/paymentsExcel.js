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
    Date: new Date(t.businessDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    Time: new Date(t.createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),

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
    { wch: 1 }, //date
    { wch: 11 }, //time
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
