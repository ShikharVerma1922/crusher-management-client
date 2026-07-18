import * as XLSX from "xlsx";

export const exportToExcelFormat = (
  tickets,
  customerName,
  startDate,
  endDate,
) => {
  if (tickets.length === 0) return;
  let runningBalance = Number(tickets.openingBalance);
  const openingBalance = runningBalance;

  const transactionRows = tickets.items.map((t) => {
    if (t.type === "DEBIT") {
      runningBalance += Number(t.amount);
    } else {
      runningBalance -= Number(t.amount);
    }

    return {
      Date: new Date(t.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }),
      Ref: t.referenceNumber,
      Particulars: t.particulars,
      "Debit Dr": t.type === "DEBIT" ? t.amount : "-",
      "Credit Cr": t.type === "CREDIT" ? t.amount : "-",
      Balance: `${Math.abs(runningBalance).toLocaleString("en-IN")} ${runningBalance >= 0 ? "Dr" : "Cr"}`,
    };
  });

  const flatSheetData = [
    {
      Date: "",
      Ref: "",
      Particulars: "Opening Balance B/F",
      "Debit Dr": "-",
      "Credit Cr": "-",
      Balance: `${Math.abs(openingBalance).toLocaleString("en-IN")} ${openingBalance >= 0 ? "Dr" : "Cr"}`,
    },
    ...transactionRows,
    {
      Date: "",
      Ref: "",
      Particulars: `Closing Balance C/F (As if ${new Date(
        endDate,
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })})`,
      "Debit Dr": "-",
      "Credit Cr": "-",
      Balance: `${Math.abs(runningBalance).toLocaleString("en-IN")} ${runningBalance >= 0 ? "Dr" : "Cr"}`,
    },
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([
    ["CUSTOMER LEDGER"],
    [],
    ["Customer", customerName],
    [
      "Period",
      `${new Date(startDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} - ${new Date(endDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
    ],
    [
      "Opening Balance",
      `${Math.abs(openingBalance).toLocaleString("en-IN")} ${openingBalance >= 0 ? "Dr" : "Cr"}`,
    ],
    [
      "Closing Balance",
      `${Math.abs(runningBalance).toLocaleString("en-IN")} ${runningBalance >= 0 ? "Dr" : "Cr"}`,
    ],
    [],
  ]);

  XLSX.utils.sheet_add_json(worksheet, flatSheetData, {
    origin: "A10",
    skipHeader: false,
  });

  const workbook = XLSX.utils.book_new();
  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 24 },
    { wch: 50 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Ledger");

  const fileStartLabel = startDate || "Start";
  const fileEndLabel = endDate || "End";

  XLSX.writeFile(
    workbook,
    `Customer_${customerName}_${fileStartLabel}_to_${fileEndLabel}.xlsx`,
  );
};
