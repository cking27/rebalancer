// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
};

export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: 'pending' | 'paid';
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
};

// Portfolio Rebalancer Types

export type Person = {
  id: number;
  name: string;
};

export type Institution = {
  id: number;
  name: string;
};

export type AccountType = 'Brokerage' | 'K401' | 'IRA' | 'RothIRA' | 'Savings' | 'Checking';

export type PositionType = 'MutualFund' | 'ETF' | 'Stock' | 'Bond' | 'Cash' | 'Other';

export type AssetClass = 'Equity' | 'FixedIncome' | 'Cash' | 'Other';

export type Account = {
  id: number;
  name: string;
  institutionId: number;
  institutionName?: string;
  ownerId: number;
  ownerName?: string;
  accountType: AccountType;
  isRetirement: boolean;
};

export type Position = {
  id: number;
  accountId: number;
  name: string;
  positionType: PositionType;
  assetClass: AssetClass;
  value: number;
};

export type AccountWithPositions = Account & {
  positions: Position[];
};

export type AllocationItem = {
  category: string;
  value: number;
  percentage: number;
};

export type AllocationSummary = {
  totalValue: number;
  byAssetClass: AllocationItem[];
  byPositionType: AllocationItem[];
  byPosition: AllocationItem[];
};

export type CreatePersonRequest = {
  name: string;
};

export type CreateInstitutionRequest = {
  name: string;
};

export type CreateAccountRequest = {
  name: string;
  institutionId: number;
  ownerId: number;
  accountType: AccountType;
  isRetirement: boolean;
};

export type CreatePositionRequest = {
  accountId: number;
  name: string;
  positionType: PositionType;
  assetClass: AssetClass;
  value: number;
};
