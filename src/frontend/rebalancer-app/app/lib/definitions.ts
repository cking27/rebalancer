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

// Security - centrally-defined asset
export type Security = {
  id: number;
  ticker: string;
  name: string;
  positionType: PositionType;
  assetClass: AssetClass;
  assetCategoryId?: number | null;
  assetCategoryName?: string | null;
  price: number;
};

// Holding - per-account record of shares and price
export type Holding = {
  id: number;
  accountId: number;
  securityId: number;
  shares: number;
  price: number;
  value: number;  // computed: shares × price
  // Security properties for convenience
  ticker: string;
  securityName: string;
  positionType: PositionType;
  assetClass: AssetClass;
  assetCategoryId?: number | null;
  assetCategoryName?: string | null;
};

export type AccountWithHoldings = Account & {
  holdings: Holding[];
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

export type CreateSecurityRequest = {
  ticker: string;
  name: string;
  positionType: PositionType;
  assetClass: AssetClass;
  assetCategoryId?: number | null;
  price: number;
};

export type UpdateSecurityRequest = CreateSecurityRequest;

export type PriceUpdateResult = {
  ticker: string;
  success: boolean;
  oldPrice: number;
  newPrice: number;
  error?: string;
};

export type RefreshPricesResponse = {
  updatedCount: number;
  failedCount: number;
  results: PriceUpdateResult[];
};

export type CreateHoldingRequest = {
  accountId: number;
  securityId: number;
  shares: number;
};

export type UpdateHoldingRequest = {
  securityId: number;
  shares: number;
};

// Asset Category Types

export type AssetCategory = {
  id: number;
  name: string;
  parentId?: number | null;
  displayOrder: number;
};

export type AssetCategoryTree = AssetCategory & {
  children: AssetCategoryTree[];
};

export type CreateAssetCategoryRequest = {
  name: string;
  parentId?: number | null;
  displayOrder: number;
};

// Model Types

export type ModelAllocation = {
  id: number;
  assetCategoryId: number;
  assetCategoryName?: string | null;
  targetPercentage: number;
};

export type Model = {
  id: number;
  name: string;
  description?: string | null;
  allocations: ModelAllocation[];
};

export type CreateModelAllocationRequest = {
  assetCategoryId: number;
  targetPercentage: number;
};

export type CreateModelRequest = {
  name: string;
  description?: string | null;
  allocations: CreateModelAllocationRequest[];
};

export type UpdateModelRequest = CreateModelRequest;

// Compare Types

export type CategoryComparison = {
  categoryId: number;
  categoryName: string;
  targetPercentage: number;
  actualPercentage: number;
  differencePercentage: number;
  differenceValue: number;
  recommendation: string;
  parentId?: number | null;
  depth: number;
  isLeaf: boolean;
};

export type UnmappedHolding = {
  holdingId: number;
  ticker: string;
  securityName: string;
  value: number;
};

export type CompareResult = {
  modelName: string;
  totalValue: number;
  comparisons: CategoryComparison[];
  unmappedHoldings: UnmappedHolding[];
  accountBreakdowns: AccountBreakdown[];
};

export type AccountBreakdown = {
  accountId: number;
  accountName: string;
  accountValue: number;
  percentOfTotal: number;
  categoryComparisons: AccountCategoryComparison[];
  holdingRecommendations: HoldingRecommendation[];
};

export type AccountCategoryComparison = {
  categoryId: number;
  categoryName: string;
  targetPercentage: number;
  actualPercentage: number;
  targetValue: number;
  actualValue: number;
  differenceValue: number;
  depth: number;
  isLeaf: boolean;
};

export type HoldingRecommendation = {
  holdingId: number;
  ticker: string;
  securityName: string;
  categoryId?: number | null;
  categoryName?: string | null;
  currentValue: number;
  suggestedChange: number;
  recommendation: string;
};
