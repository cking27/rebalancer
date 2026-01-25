import {
  Person,
  Institution,
  Account,
  AccountWithPositions,
  Position,
  AllocationSummary,
  CreatePersonRequest,
  CreateInstitutionRequest,
  CreateAccountRequest,
  CreatePositionRequest,
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

export async function getAccountWithPositions(id: number): Promise<AccountWithPositions> {
  return fetchApi<AccountWithPositions>(`/Account/${id}/positions`);
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

// Positions API
export async function getPositions(): Promise<Position[]> {
  return fetchApi<Position[]>('/Position');
}

export async function getPosition(id: number): Promise<Position> {
  return fetchApi<Position>(`/Position/${id}`);
}

export async function getPositionsByAccount(accountId: number): Promise<Position[]> {
  return fetchApi<Position[]>(`/Position/account/${accountId}`);
}

export async function createPosition(data: CreatePositionRequest): Promise<Position> {
  return fetchApi<Position>('/Position', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePosition(id: number, data: Omit<CreatePositionRequest, 'accountId'>): Promise<void> {
  return fetchApi<void>(`/Position/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePosition(id: number): Promise<void> {
  return fetchApi<void>(`/Position/${id}`, {
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
