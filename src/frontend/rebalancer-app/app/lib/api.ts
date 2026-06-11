import {
  Person,
  Institution,
  Account,
  AccountWithHoldings,
  Security,
  Holding,
  AllocationSummary,
  CreatePersonRequest,
  CreateInstitutionRequest,
  CreateAccountRequest,
  CreateSecurityRequest,
  UpdateSecurityRequest,
  CreateHoldingRequest,
  UpdateHoldingRequest,
  AssetCategory,
  AssetCategoryTree,
  CreateAssetCategoryRequest,
  Model,
  CreateModelRequest,
  UpdateModelRequest,
  CompareResult,
  RefreshPricesResponse,
} from './definitions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// People API
export async function getPeople(): Promise<Person[]> {
  return fetchApi<Person[]>('/Person');
}

export async function getPerson(id: number): Promise<Person> {
  return fetchApi<Person>(`/Person/${id}`);
}

export async function createPerson(data: CreatePersonRequest): Promise<Person> {
  return fetchApi<Person>('/Person', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePerson(id: number, data: CreatePersonRequest): Promise<void> {
  return fetchApi<void>(`/Person/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePerson(id: number): Promise<void> {
  return fetchApi<void>(`/Person/${id}`, {
    method: 'DELETE',
  });
}

// Institutions API
export async function getInstitutions(): Promise<Institution[]> {
  return fetchApi<Institution[]>('/Institution');
}

export async function getInstitution(id: number): Promise<Institution> {
  return fetchApi<Institution>(`/Institution/${id}`);
}

export async function createInstitution(data: CreateInstitutionRequest): Promise<Institution> {
  return fetchApi<Institution>('/Institution', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInstitution(id: number, data: CreateInstitutionRequest): Promise<void> {
  return fetchApi<void>(`/Institution/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInstitution(id: number): Promise<void> {
  return fetchApi<void>(`/Institution/${id}`, {
    method: 'DELETE',
  });
}

// Accounts API
export async function getAccounts(): Promise<Account[]> {
  return fetchApi<Account[]>('/Account');
}

export async function getAccount(id: number): Promise<Account> {
  return fetchApi<Account>(`/Account/${id}`);
}

export async function getAccountWithHoldings(id: number): Promise<AccountWithHoldings> {
  return fetchApi<AccountWithHoldings>(`/Account/${id}/holdings`);
}

export async function createAccount(data: CreateAccountRequest): Promise<Account> {
  return fetchApi<Account>('/Account', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAccount(id: number, data: CreateAccountRequest): Promise<void> {
  return fetchApi<void>(`/Account/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: number): Promise<void> {
  return fetchApi<void>(`/Account/${id}`, {
    method: 'DELETE',
  });
}

// Securities API
export async function getSecurities(): Promise<Security[]> {
  return fetchApi<Security[]>('/Security');
}

export async function getSecurity(id: number): Promise<Security> {
  return fetchApi<Security>(`/Security/${id}`);
}

export async function getSecurityByTicker(ticker: string): Promise<Security> {
  return fetchApi<Security>(`/Security/ticker/${ticker}`);
}

export async function createSecurity(data: CreateSecurityRequest): Promise<Security> {
  return fetchApi<Security>('/Security', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSecurity(id: number, data: UpdateSecurityRequest): Promise<void> {
  return fetchApi<void>(`/Security/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSecurity(id: number): Promise<void> {
  return fetchApi<void>(`/Security/${id}`, {
    method: 'DELETE',
  });
}

export async function refreshSecurityPrices(): Promise<RefreshPricesResponse> {
  return fetchApi<RefreshPricesResponse>('/Security/refresh-prices', {
    method: 'POST',
  });
}

// Holdings API
export async function getHoldings(): Promise<Holding[]> {
  return fetchApi<Holding[]>('/Holding');
}

export async function getHolding(id: number): Promise<Holding> {
  return fetchApi<Holding>(`/Holding/${id}`);
}

export async function getHoldingsByAccount(accountId: number): Promise<Holding[]> {
  return fetchApi<Holding[]>(`/Holding/account/${accountId}`);
}

export async function createHolding(data: CreateHoldingRequest): Promise<Holding> {
  return fetchApi<Holding>('/Holding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHolding(id: number, data: UpdateHoldingRequest): Promise<void> {
  return fetchApi<void>(`/Holding/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteHolding(id: number): Promise<void> {
  return fetchApi<void>(`/Holding/${id}`, {
    method: 'DELETE',
  });
}

// Allocation API
export async function getAllocation(accountIds?: number[]): Promise<AllocationSummary> {
  const params = accountIds && accountIds.length > 0
    ? `?${accountIds.map(id => `accountIds=${id}`).join('&')}`
    : '';
  return fetchApi<AllocationSummary>(`/Allocation${params}`);
}

// Asset Categories API
export async function getAssetCategories(): Promise<AssetCategory[]> {
  return fetchApi<AssetCategory[]>('/AssetCategory');
}

export async function getAssetCategoriesTree(): Promise<AssetCategoryTree[]> {
  return fetchApi<AssetCategoryTree[]>('/AssetCategory/tree');
}

export async function getAssetCategory(id: number): Promise<AssetCategory> {
  return fetchApi<AssetCategory>(`/AssetCategory/${id}`);
}

export async function createAssetCategory(data: CreateAssetCategoryRequest): Promise<AssetCategory> {
  return fetchApi<AssetCategory>('/AssetCategory', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAssetCategory(id: number, data: CreateAssetCategoryRequest): Promise<void> {
  return fetchApi<void>(`/AssetCategory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAssetCategory(id: number): Promise<void> {
  return fetchApi<void>(`/AssetCategory/${id}`, {
    method: 'DELETE',
  });
}

// Models API
export async function getModels(): Promise<Model[]> {
  return fetchApi<Model[]>('/Model');
}

export async function getModel(id: number): Promise<Model> {
  return fetchApi<Model>(`/Model/${id}`);
}

export async function createModel(data: CreateModelRequest): Promise<Model> {
  return fetchApi<Model>('/Model', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateModel(id: number, data: UpdateModelRequest): Promise<void> {
  return fetchApi<void>(`/Model/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteModel(id: number): Promise<void> {
  return fetchApi<void>(`/Model/${id}`, {
    method: 'DELETE',
  });
}

export async function compareToModel(modelId: number, accountIds: number[]): Promise<CompareResult> {
  return fetchApi<CompareResult>(`/Model/${modelId}/compare`, {
    method: 'POST',
    body: JSON.stringify({ accountIds }),
  });
}
