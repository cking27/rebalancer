'use client';

import { useEffect, useState, Fragment } from 'react';
import { Security, PositionType, AssetClass, AssetCategory, CreateCompositionRequest } from '@/app/lib/definitions';
import { getSecurities, createSecurity, updateSecurity, deleteSecurity, getAssetCategories, refreshSecurityPrices } from '@/app/lib/api';
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

type CompositionRow = { componentSecurityId: number; percentage: number };

function CompositionEditor({
  compositions,
  onChange,
  securities,
  ownSecurityId,
}: {
  compositions: CompositionRow[];
  onChange: (rows: CompositionRow[]) => void;
  securities: Security[];
  ownSecurityId?: number;
}) {
  const total = compositions.reduce((sum, c) => sum + (c.percentage || 0), 0);
  const eligible = securities.filter((s) => s.id !== ownSecurityId);

  const addRow = () => {
    const first = eligible.find((s) => !compositions.some((c) => c.componentSecurityId === s.id));
    onChange([...compositions, { componentSecurityId: first?.id ?? eligible[0]?.id ?? 0, percentage: 0 }]);
  };

  const updateRow = (index: number, field: keyof CompositionRow, value: number) => {
    const next = compositions.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(compositions.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Composition (fund-of-funds)</h4>
        <button
          type="button"
          onClick={addRow}
          disabled={eligible.length === 0}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" />
          Add component
        </button>
      </div>

      {compositions.length === 0 ? (
        <p className="text-xs text-gray-400">No composition defined. Add components if this security is a blend of others.</p>
      ) : (
        <div className="space-y-2">
          {compositions.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={row.componentSecurityId}
                onChange={(e) => updateRow(i, 'componentSecurityId', Number(e.target.value))}
                className="flex-1 border rounded-md px-2 py-1 text-sm"
              >
                {eligible.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ticker} — {s.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={row.percentage || ''}
                onChange={(e) => updateRow(i, 'percentage', Number(e.target.value))}
                placeholder="%"
                min="0"
                max="100"
                step="0.01"
                className="w-20 border rounded-md px-2 py-1 text-sm text-right"
              />
              <span className="text-sm text-gray-500">%</span>
              <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className={`text-xs font-medium ${Math.abs(total - 100) > 0.01 ? 'text-amber-600' : 'text-green-600'}`}>
            Total: {total.toFixed(2)}%{Math.abs(total - 100) > 0.01 ? ' (should sum to 100%)' : ' ✓'}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SecuritiesPage() {
  const [securities, setSecurities] = useState<Security[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  const [newCompositions, setNewCompositions] = useState<CompositionRow[]>([]);
  const [editSecurity, setEditSecurity] = useState({
    ticker: '',
    name: '',
    positionType: 'MutualFund' as PositionType,
    assetClass: 'Equity' as AssetClass,
    assetCategoryId: null as number | null,
    price: 0,
  });
  const [editCompositions, setEditCompositions] = useState<CompositionRow[]>([]);

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
      const compositions: CreateCompositionRequest[] = newCompositions.map((c) => ({
        componentSecurityId: c.componentSecurityId,
        percentage: c.percentage,
      }));
      await createSecurity({
        ticker: newSecurity.ticker.toUpperCase(),
        name: newSecurity.name,
        positionType: newSecurity.positionType,
        assetClass: newSecurity.assetClass,
        assetCategoryId: compositions.length > 0 ? null : newSecurity.assetCategoryId,
        price: newSecurity.price,
        compositions: compositions.length > 0 ? compositions : undefined,
      });
      setNewSecurity({ ticker: '', name: '', positionType: 'MutualFund', assetClass: 'Equity', assetCategoryId: null, price: 0 });
      setNewCompositions([]);
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
      const compositions: CreateCompositionRequest[] = editCompositions.map((c) => ({
        componentSecurityId: c.componentSecurityId,
        percentage: c.percentage,
      }));
      await updateSecurity(id, {
        ticker: editSecurity.ticker.toUpperCase(),
        name: editSecurity.name,
        positionType: editSecurity.positionType,
        assetClass: editSecurity.assetClass,
        assetCategoryId: compositions.length > 0 ? null : editSecurity.assetCategoryId,
        price: editSecurity.price,
        compositions: compositions.length > 0 ? compositions : [],
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
    setEditCompositions(
      (security.compositions ?? []).map((c) => ({
        componentSecurityId: c.componentSecurityId,
        percentage: c.percentage,
      }))
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const handleRefreshPrices = async () => {
    if (securities.length === 0) {
      setError('No securities to refresh');
      return;
    }
    try {
      setRefreshing(true);
      setError(null);
      setSuccessMessage(null);
      const result = await refreshSecurityPrices();
      await fetchSecurities();
      if (result.failedCount > 0) {
        const failures = result.results.filter(r => !r.success).map(r => r.ticker).join(', ');
        setError(`Failed to update prices for: ${failures}`);
      }
      if (result.updatedCount > 0) {
        setSuccessMessage(`Updated prices for ${result.updatedCount} securities`);
      }
    } catch (err) {
      setError('Failed to refresh prices');
      console.error(err);
    } finally {
      setRefreshing(false);
    }
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
        <div className="flex gap-2">
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing || securities.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            Add Security
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="ml-4 text-green-800 underline">Dismiss</button>
        </div>
      )}

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
              <label className={`block text-sm font-medium mb-1 ${newCompositions.length > 0 ? 'text-gray-400' : ''}`}>
                Asset Category {newCompositions.length > 0 ? '(overridden by composition)' : '(for model allocation)'}
              </label>
              <select
                value={newSecurity.assetCategoryId ?? ''}
                onChange={(e) => setNewSecurity({ ...newSecurity, assetCategoryId: e.target.value ? Number(e.target.value) : null })}
                disabled={newCompositions.length > 0}
                className={`w-full border rounded-md px-3 py-2 ${newCompositions.length > 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
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
          <CompositionEditor
            compositions={newCompositions}
            onChange={setNewCompositions}
            securities={securities}
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddSecurity}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewSecurity({ ticker: '', name: '', positionType: 'MutualFund', assetClass: 'Equity', assetCategoryId: null, price: 0 }); setNewCompositions([]); }}
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
              <th className="text-left py-3 px-4">Category / Composition</th>
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
                <Fragment key={security.id}>
                  <tr className="border-b hover:bg-gray-50">
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
                            disabled={editCompositions.length > 0}
                            className={`border rounded-md px-2 py-1 w-full ${editCompositions.length > 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                          {security.compositions?.length > 0 ? (
                            <span className="text-xs text-indigo-600 font-medium">
                              Composite ({security.compositions.length} components)
                            </span>
                          ) : security.assetCategoryName ? (
                            security.assetCategoryName
                          ) : (
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
                  {editingId === security.id && (
                    <tr className="border-b bg-gray-50">
                      <td colSpan={7} className="px-4 pb-4">
                        <CompositionEditor
                          compositions={editCompositions}
                          onChange={setEditCompositions}
                          securities={securities}
                          ownSecurityId={security.id}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
