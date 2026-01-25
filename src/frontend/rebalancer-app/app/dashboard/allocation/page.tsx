'use client';

import { useEffect, useState } from 'react';
import { Account, AllocationSummary } from '@/app/lib/definitions';
import { getAccounts, getAllocation } from '@/app/lib/api';

export default function AllocationPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [allocation, setAllocation] = useState<AllocationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await getAccounts();
        setAccounts(data);
        // Select all accounts by default
        setSelectedAccountIds(data.map(a => a.id));
      } catch (err) {
        setError('Failed to load accounts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchAllocation = async () => {
      if (selectedAccountIds.length === 0) {
        setAllocation(null);
        return;
      }
      try {
        const data = await getAllocation(selectedAccountIds);
        setAllocation(data);
      } catch (err) {
        setError('Failed to load allocation');
        console.error(err);
      }
    };
    fetchAllocation();
  }, [selectedAccountIds]);

  const toggleAccount = (id: number) => {
    setSelectedAccountIds(prev =>
      prev.includes(id)
        ? prev.filter(accountId => accountId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => setSelectedAccountIds(accounts.map(a => a.id));
  const selectNone = () => setSelectedAccountIds([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Portfolio Allocation</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Account Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Select Accounts</h2>
              <div className="flex gap-2 text-sm">
                <button onClick={selectAll} className="text-blue-600 hover:underline">All</button>
                <span>|</span>
                <button onClick={selectNone} className="text-blue-600 hover:underline">None</button>
              </div>
            </div>
            {accounts.length === 0 ? (
              <p className="text-gray-500 text-sm">No accounts found. Create accounts to see allocation.</p>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <label key={account.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(account.id)}
                      onChange={() => toggleAccount(account.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{account.name}</span>
                    <span className="text-xs text-gray-500">({account.ownerName})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Allocation Display */}
        <div className="lg:col-span-3">
          {!allocation || selectedAccountIds.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Select accounts to view allocation
            </div>
          ) : (
            <div className="space-y-6">
              {/* Total Value */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-sm text-gray-500 mb-1">Total Portfolio Value</h2>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(allocation.totalValue)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAccountIds.length} account{selectedAccountIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* By Asset Class */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold mb-4">By Asset Class</h2>
                {allocation.byAssetClass.length === 0 ? (
                  <p className="text-gray-500 text-sm">No positions in selected accounts</p>
                ) : (
                  <div className="space-y-3">
                    {allocation.byAssetClass.map((item) => (
                      <div key={item.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.category}</span>
                          <span>
                            {formatCurrency(item.value)} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* By Position Type */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold mb-4">By Position Type</h2>
                {allocation.byPositionType.length === 0 ? (
                  <p className="text-gray-500 text-sm">No positions in selected accounts</p>
                ) : (
                  <div className="space-y-3">
                    {allocation.byPositionType.map((item) => (
                      <div key={item.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.category}</span>
                          <span>
                            {formatCurrency(item.value)} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* By Position */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold mb-4">By Individual Position</h2>
                {allocation.byPosition.length === 0 ? (
                  <p className="text-gray-500 text-sm">No positions in selected accounts</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-sm">Position</th>
                          <th className="text-right py-2 px-2 text-sm">Value</th>
                          <th className="text-right py-2 px-2 text-sm">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocation.byPosition.map((item) => (
                          <tr key={item.category} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-2 text-sm">{item.category}</td>
                            <td className="py-2 px-2 text-sm text-right">{formatCurrency(item.value)}</td>
                            <td className="py-2 px-2 text-sm text-right">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
