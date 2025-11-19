export const products: any[] = []; // Products are managed via database API

export const CURRENCY_RATES: Record<string, { symbol: string; rate: number; name: string }> = {
  NGN: { symbol: "₦", rate: 1, name: "Nigerian Naira" },
  USD: { symbol: "$", rate: 1 / 1540, name: "US Dollar" },
  EUR: { symbol: "€", rate: 0.92 / 1540, name: "Euro" },
  GBP: { symbol: "£", rate: 0.79 / 1540, name: "British Pound" },
  CAD: { symbol: "C$", rate: 1.36 / 1540, name: "Canadian Dollar" },
  AUD: { symbol: "A$", rate: 1.53 / 1540, name: "Australian Dollar" },
  INR: { symbol: "₹", rate: 83.5 / 1540, name: "Indian Rupee" },
};
