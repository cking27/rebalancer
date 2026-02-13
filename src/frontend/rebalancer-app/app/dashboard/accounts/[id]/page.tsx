'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountWithHoldings, Holding, Security, PositionType, AssetClass, AssetCategory } from '@/app/lib/definitions';
import { getAccountWithHoldings, createHolding, updateHolding, deleteHolding, getSecurities, getAssetCategories } from '@/app/lib/api';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const positionTypeLabels: Record<PositionType, string> = {
  MutualFund: 'Mutual Fund',
  ETF: 'ETF',
  Stock: 'Stock',
  Bond: 'Bond',
  Cash: 'Cash',
  Other: 'Other',
};

const assetClassLabels: Record<AssetClass, string> = {
  Equity: 'Equity',
  FixedIncome: 'Fixed Income',
  Cash: 'Cash',
  Other: 'Other',
};

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = Number(params.id);

  const [account, setAccount] = useState<AccountWithHoldings | null>(null);
  const [securities, setSecurities] = useState<Security[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newHolding, setNewHolding] = useState({
    securityId: 0,
    shares: 0,
  });
  const [editHolding, setEditHolding] = useState({
    securityId: 0,
    shares: 0,
  });

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const [accountData, securitiesData, categoriesData] = await Promise.all([
        getAccountWithHoldings(accountId),
        getSecurities(),
        getAssetCategories(),
      ]);
      setAccount(accountData);
      setSecurities(securitiesData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError('Failed to load account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [accountId]);

  const handleAddHolding = async () => {
    if (newHolding.securityId === 0 || newHolding.shares <= 0) {
      setError('Please select a security and enter shares');
      return;
    }
    try {
      await createHolding({
        accountId,
        securityId: newHolding.securityId,
        shares: newHolding.shares,
      });
      setNewHolding({ securityId: 0, shares: 0 });
      setIsAdding(false);
      await fetchAccount();
    } catch (err) {
      setError('Failed to add holding');
      console.error(err);
    }
  };

  const handleUpdateHolding = async (id: number) => {
    if (editHolding.securityId === 0 || editHolding.shares <= 0) {
      setError('Please select a security and enter shares');
      return;
    }
    try {
      await updateHolding(id, {
        securityId: editHolding.securityId,
        shares: editHolding.shares,
      });
      setEditingId(null);
      await fetchAccount();
    } catch (err) {
      setError('Failed to update holding');
      console.error(err);
    }
  };

  const handleDeleteHolding = async (id: number) => {
    if (!confirm('Are you sure you want to delete this holding?')) return;
    try {
      await deleteHolding(id);
      await fetchAccount();
    } catch (err) {
      setError('Failed to delete holding');
      console.error(err);
    }
  };

  const startEdit = (holding: Holding) => {
    setEditingId(holding.id);
    setEditHolding({
      securityId: holding.securityId,
      shares: holding.shares,
    });
  };

  const totalValue = account?.holdings.reduce((sum, h) => sum + h.value, 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  // Get selected security price for new holding
  const selectedSecurity = securities.find(s => s.id === newHolding.securityId);
  const newHoldingPrice = selectedSecurity?.price ?? 0;
  const newHoldingValue = newHolding.shares * newHoldingPrice;

  // Get selected security price for edit holding
  const editSelectedSecurity = securities.find(s => s.id === editHolding.securityId);
  const editHoldingPrice = editSelectedSecurity?.price ?? 0;
  const editHoldingValue = editHolding.shares * editHoldingPrice;

  if (loading) return <div className="p-4">Loading...</div>;
  if (!account) return <div className="p-4">Account not found</div>;

  return (
    <div className="p-4">
      <div className="mb-6">
        <Link href="/dashboard/accounts" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Accounts
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <p className="text-gray-600">
              {account.ownerName} | {account.institutionName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Holdings</h2>
        <div className="flex gap-2">
          <Link
            href="/dashboard/securities"
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Manage Securities
          </Link>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            Add Holding
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="font-semibold mb-3">New Holding</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Security</label>
              <select
                value={newHolding.securityId}
                onChange={(e) => setNewHolding({ ...newHolding, securityId: Number(e.target.value) })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value={0}>Select a security...</option>
                {securities.map((security) => (
                  <option key={security.id} value={security.id}>
                    {security.ticker} - {security.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shares</label>
              <input
                type="number"
                value={newHolding.shares || ''}
                onChange={(e) => setNewHolding({ ...newHolding, shares: Number(e.target.value) })}
                placeholder="0"
                className="w-full border rounded-md px-3 py-2"
                min="0"
                step="0.0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (from security)</label>
              <div className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-700">
                {formatCurrency(newHoldingPrice)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value (computed)</label>
              <div className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-700">
                {formatCurrency(newHoldingValue)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddHolding}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewHolding({ securityId: 0, shares: 0 }); }}
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
              <th className="text-left py-3 px-4">Ticker</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-right py-3 px-4">Shares</th>
              <th className="text-right py-3 px-4">Price</th>
              <th className="text-right py-3 px-4">Value</th>
              <th className="text-right py-3 px-4">% of Account</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {account.holdings.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  No holdings found. Add one to get started.
                </td>
              </tr>
            ) : (
              account.holdings.map((holding) => (
                <tr key={holding.id} className="border-b hover:bg-gray-50">
                  {editingId === holding.id ? (
                    <>
                      <td className="py-3 px-4" colSpan={2}>
                        <select
                          value={editHolding.securityId}
                          onChange={(e) => setEditHolding({ ...editHolding, securityId: Number(e.target.value) })}
                          className="border rounded-md px-2 py-1 w-full"
                        >
                          {securities.map((security) => (
                            <option key={security.id} value={security.id}>
                              {security.ticker} - {security.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">-</td>
                      <td className="py-3 px-4">-</td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={editHolding.shares || ''}
                          onChange={(e) => setEditHolding({ ...editHolding, shares: Number(e.target.value) })}
                          className="border rounded-md px-2 py-1 w-24 text-right"
                          min="0"
                          step="0.0001"
                        />
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500">
                        {formatCurrency(editHoldingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(editHoldingValue)}</td>
                      <td className="py-3 px-4 text-right">-</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateHolding(holding.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 font-medium">{holding.ticker}</td>
                      <td className="py-3 px-4">{holding.securityName}</td>
                      <td className="py-3 px-4">{positionTypeLabels[holding.positionType]}</td>
                      <td className="py-3 px-4">
                        {holding.assetCategoryName || (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">{formatNumber(holding.shares, 4)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(holding.price)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(holding.value)}</td>
                      <td className="py-3 px-4 text-right">
                        {totalValue > 0 ? ((holding.value / totalValue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(holding)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHolding(holding.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
