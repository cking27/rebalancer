'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Account, Person, Institution, AccountType } from '@/app/lib/definitions';
import { getAccounts, getPeople, getInstitutions, createAccount, deleteAccount } from '@/app/lib/api';
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const accountTypes: AccountType[] = ['Brokerage', 'K401', 'IRA', 'RothIRA', 'Savings', 'Checking'];

const accountTypeLabels: Record<AccountType, string> = {
  Brokerage: 'Brokerage',
  K401: '401(k)',
  IRA: 'IRA',
  RothIRA: 'Roth IRA',
  Savings: 'Savings',
  Checking: 'Checking',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    institutionId: 0,
    ownerId: 0,
    accountType: 'Brokerage' as AccountType,
    isRetirement: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, peopleData, institutionsData] = await Promise.all([
        getAccounts(),
        getPeople(),
        getInstitutions(),
      ]);
      setAccounts(accountsData);
      setPeople(peopleData);
      setInstitutions(institutionsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!newAccount.name.trim() || !newAccount.institutionId || !newAccount.ownerId) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      await createAccount(newAccount);
      setNewAccount({
        name: '',
        institutionId: 0,
        ownerId: 0,
        accountType: 'Brokerage',
        isRetirement: false,
      });
      setIsAdding(false);
      await fetchData();
    } catch (err) {
      setError('Failed to add account');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      await deleteAccount(id);
      await fetchData();
    } catch (err) {
      setError('Failed to delete account');
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          disabled={people.length === 0 || institutions.length === 0}
        >
          <PlusIcon className="w-5 h-5" />
          Add Account
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {(people.length === 0 || institutions.length === 0) && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Please add at least one <Link href="/dashboard/people" className="underline">person</Link> and
          one <Link href="/dashboard/institutions" className="underline">institution</Link> before creating accounts.
        </div>
      )}

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="font-semibold mb-3">New Account</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="Account name"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Owner</label>
              <select
                value={newAccount.ownerId}
                onChange={(e) => setNewAccount({ ...newAccount, ownerId: Number(e.target.value) })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value={0}>Select owner</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Institution</label>
              <select
                value={newAccount.institutionId}
                onChange={(e) => setNewAccount({ ...newAccount, institutionId: Number(e.target.value) })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value={0}>Select institution</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select
                value={newAccount.accountType}
                onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value as AccountType })}
                className="w-full border rounded-md px-3 py-2"
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>{accountTypeLabels[type]}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAccount.isRetirement}
                  onChange={(e) => setNewAccount({ ...newAccount, isRetirement: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Retirement Account</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewAccount({ name: '', institutionId: 0, ownerId: 0, accountType: 'Brokerage', isRetirement: false }); }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Owner</th>
              <th className="text-left py-3 px-4">Institution</th>
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Retirement</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No accounts found. Add one to get started.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{account.name}</td>
                  <td className="py-3 px-4">{account.ownerName}</td>
                  <td className="py-3 px-4">{account.institutionName}</td>
                  <td className="py-3 px-4">{accountTypeLabels[account.accountType]}</td>
                  <td className="py-3 px-4">
                    {account.isRetirement ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Yes</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">No</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/accounts/${account.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
