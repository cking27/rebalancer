'use client';

import { useEffect, useState } from 'react';
import { Security, PositionType, AssetClass, AssetCategory } from '@/app/lib/definitions';
import { getSecurities, createSecurity, updateSecurity, deleteSecurity, getAssetCategories } from '@/app/lib/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const positionTypes: PositionType[] = ['MutualFund', 'ETF', 'Stock', 'Bond', 'Cash', 'Other'];
const assetClasses: AssetClass[] = ['Equity', 'FixedIncome', 'Cash', 'Other'];

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

export default function SecuritiesPage() {
  const [securities, setSecurities] = useState<Security[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newSecurity, setNewSecurity] = useState({
    ticker: '',
    name: '',
    positionType: 'MutualFund' as PositionType,
    assetClass: 'Equity' as AssetClass,
    assetCategoryId: null as number | null,
    price: 0,
  });
  const [editSecurity, setEditSecurity] = useState({
    ticker: '',
    name: '',
    positionType: 'MutualFund' as PositionType,
    assetClass: 'Equity' as AssetClass,
    assetCategoryId: null as number | null,
    price: 0,
  });

  const fetchSecurities = async () => {
    try {
      setLoading(true);
      const [securitiesData, categoriesData] = await Promise.all([
        getSecurities(),
        getAssetCategories(),
      ]);
      setSecurities(securitiesData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError('Failed to load securities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurities();
  }, []);

  const handleAddSecurity = async () => {
    if (!newSecurity.ticker.trim() || !newSecurity.name.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      await createSecurity({
        ticker: newSecurity.ticker.toUpperCase(),
        name: newSecurity.name,
        positionType: newSecurity.positionType,
        assetClass: newSecurity.assetClass,
        assetCategoryId: newSecurity.assetCategoryId,
        price: newSecurity.price,
      });
      setNewSecurity({ ticker: '', name: '', positionType: 'MutualFund', assetClass: 'Equity', assetCategoryId: null, price: 0 });
      setIsAdding(false);
      await fetchSecurities();
    } catch (err) {
      setError('Failed to add security');
      console.error(err);
    }
  };

  const handleUpdateSecurity = async (id: number) => {
    if (!editSecurity.ticker.trim() || !editSecurity.name.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      await updateSecurity(id, {
        ticker: editSecurity.ticker.toUpperCase(),
        name: editSecurity.name,
        positionType: editSecurity.positionType,
        assetClass: editSecurity.assetClass,
        assetCategoryId: editSecurity.assetCategoryId,
        price: editSecurity.price,
      });
      setEditingId(null);
      await fetchSecurities();
    } catch (err) {
      setError('Failed to update security');
      console.error(err);
    }
  };

  const handleDeleteSecurity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this security? This will fail if there are holdings referencing it.')) return;
    try {
      await deleteSecurity(id);
      await fetchSecurities();
    } catch (err) {
      setError('Failed to delete security. It may be referenced by existing holdings.');
      console.error(err);
    }
  };

  const startEdit = (security: Security) => {
    setEditingId(security.id);
    setEditSecurity({
      ticker: security.ticker,
      name: security.name,
      positionType: security.positionType,
      assetClass: security.assetClass,
      assetCategoryId: security.assetCategoryId ?? null,
      price: security.price,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Securities</h1>
          <p className="text-gray-600">
            Manage your securities catalog. Securities are shared across all accounts.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Add Security
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-800 underline">Dismiss</button>
        </div>
      )}

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="font-semibold mb-3">New Security</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ticker (e.g., VTSAX)</label>
              <input
                type="text"
                value={newSecurity.ticker}
                onChange={(e) => setNewSecurity({ ...newSecurity, ticker: e.target.value })}
                placeholder="VTSAX"
                className="w-full border rounded-md px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newSecurity.name}
                onChange={(e) => setNewSecurity({ ...newSecurity, name: e.target.value })}
                placeholder="Vanguard Total Stock Market Index Fund"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position Type</label>
              <select
                value={newSecurity.positionType}
                onChange={(e) => setNewSecurity({ ...newSecurity, positionType: e.target.value as PositionType })}
                className="w-full border rounded-md px-3 py-2"
              >
                {positionTypes.map((type) => (
                  <option key={type} value={type}>{positionTypeLabels[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Asset Class</label>
              <select
                value={newSecurity.assetClass}
                onChange={(e) => setNewSecurity({ ...newSecurity, assetClass: e.target.value as AssetClass })}
                className="w-full border rounded-md px-3 py-2"
              >
                {assetClasses.map((type) => (
                  <option key={type} value={type}>{assetClassLabels[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Asset Category (for model allocation)</label>
              <select
                value={newSecurity.assetCategoryId ?? ''}
                onChange={(e) => setNewSecurity({ ...newSecurity, assetCategoryId: e.target.value ? Number(e.target.value) : null })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <input
                type="number"
                value={newSecurity.price || ''}
                onChange={(e) => setNewSecurity({ ...newSecurity, price: Number(e.target.value) })}
                placeholder="0.00"
                className="w-full border rounded-md px-3 py-2"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddSecurity}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewSecurity({ ticker: '', name: '', positionType: 'MutualFund', assetClass: 'Equity', assetCategoryId: null, price: 0 }); }}
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
              <th className="text-left py-3 px-4">Asset Class</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-right py-3 px-4">Price</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {securities.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No securities found. Add one to get started.
                </td>
              </tr>
            ) : (
              securities.map((security) => (
                <tr key={security.id} className="border-b hover:bg-gray-50">
                  {editingId === security.id ? (
                    <>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editSecurity.ticker}
                          onChange={(e) => setEditSecurity({ ...editSecurity, ticker: e.target.value })}
                          className="border rounded-md px-2 py-1 w-full uppercase"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editSecurity.name}
                          onChange={(e) => setEditSecurity({ ...editSecurity, name: e.target.value })}
                          className="border rounded-md px-2 py-1 w-full"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editSecurity.positionType}
                          onChange={(e) => setEditSecurity({ ...editSecurity, positionType: e.target.value as PositionType })}
                          className="border rounded-md px-2 py-1 w-full"
                        >
                          {positionTypes.map((type) => (
                            <option key={type} value={type}>{positionTypeLabels[type]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editSecurity.assetClass}
                          onChange={(e) => setEditSecurity({ ...editSecurity, assetClass: e.target.value as AssetClass })}
                          className="border rounded-md px-2 py-1 w-full"
                        >
                          {assetClasses.map((type) => (
                            <option key={type} value={type}>{assetClassLabels[type]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editSecurity.assetCategoryId ?? ''}
                          onChange={(e) => setEditSecurity({ ...editSecurity, assetCategoryId: e.target.value ? Number(e.target.value) : null })}
                          className="border rounded-md px-2 py-1 w-full"
                        >
                          <option value="">None</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={editSecurity.price || ''}
                          onChange={(e) => setEditSecurity({ ...editSecurity, price: Number(e.target.value) })}
                          className="border rounded-md px-2 py-1 w-24 text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateSecurity(security.id)}
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
                      <td className="py-3 px-4 font-medium">{security.ticker}</td>
                      <td className="py-3 px-4">{security.name}</td>
                      <td className="py-3 px-4">{positionTypeLabels[security.positionType]}</td>
                      <td className="py-3 px-4">{assetClassLabels[security.assetClass]}</td>
                      <td className="py-3 px-4">
                        {security.assetCategoryName || (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(security.price)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(security)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSecurity(security.id)}
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
