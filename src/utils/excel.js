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
    "Vehicle No.": t.vehicleNumber.toUpperCase(),
    Site: t.site,
    Mat: t.material?.name || "undefined",
    "M.Qty": t.materialQuantity,
    "M.Rate": t.materialRate,
    "M.Amt": t.materialAmount,
    "R.Qty": t.royaltyQuantity,
    "R.Rate": t.royaltyRate,
    "R.Amt": t.royaltyAmount,
    "P.Mode": t.paymentMode,
    "G.Total": t.grandTotal,
    "A.Paid": t.amountPaid,
    Balance: t.balance,
  }));

  const worksheet = XLSX.utils.json_to_sheet(flatSheetData);
  const workbook = XLSX.utils.book_new();
  worksheet["!cols"] = [
    { wch: 8 }, //receipt
    { wch: 22 }, //date
    { wch: 20 }, //name
    { wch: 14 }, //vehicle
    { wch: 20 }, //site
    { wch: 10 }, //material
    { wch: 10 }, //material qty
    { wch: 10 }, //material rate
    { wch: 10 }, //material amt
    { wch: 10 }, //royalty qty
    { wch: 10 }, //royalty rate
    { wch: 10 }, //royalty amt
    { wch: 10 }, //payment mode
    { wch: 10 }, //grand total
    { wch: 10 }, //amount paid
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
    `Sales_Ledger${searchLabel}_${fileStartLabel}_to_${fileEndLabel}.xlsx`,
  );
};
