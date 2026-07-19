export const calculateBusinessDate = (paymentDate = new Date()) => {
  const date =
    paymentDate instanceof Date ? paymentDate : new Date(paymentDate);

  const operationalDate = new Date(date);
  operationalDate.setHours(operationalDate.getHours() - 9);

  const year = operationalDate.getFullYear();
  const month = String(operationalDate.getMonth() + 1).padStart(2, "0");
  const day = String(operationalDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
