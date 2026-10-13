export function normalizeInputNumber(value: string): string {
  if (!value) return '';
  return value
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[،]/g, '.')
    .replace(/\s+/g, '');
}

export function formatCurrency(amount: number, decimals: number = 2): string {
  if (isNaN(amount)) return '$0.00';
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}
