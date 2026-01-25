'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountWithPositions, Position, PositionType, AssetClass, AssetCategory } from '@/app/lib/definitions';
import { getAccountWithPositions, createPosition, updatePosition, deletePosition, getAssetCategories } from '@/app/lib/api';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = Number(params.id);

  const [account, setAccount] = useState<AccountWithPositions | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState({
    name: '',
    positionType: 'MutualFund' as PositionType,
    assetClass: 'Equity' as AssetClass,
    value: 0,
    assetCategoryId: null as number | null,
  });
  const [editPosition, setEditPosition] = useState({
    name: '',
    positionType: 'MutualFund' as PositionType,
    assetClass: 'Equity' as AssetClass,
    value: 0,
    assetCategoryId: null as number | null,
  });

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const [accountData, categoriesData] = await Promise.all([
        getAccountWithPositions(accountId),
        getAssetCategories(),
      ]);
      setAccount(accountData);
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

  const handleAddPosition = async () => {
    if (!newPosition.name.trim() || newPosition.value <= 0) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      await createPosition({
        accountId,
        name: newPosition.name,
        positionType: newPosition.positionType,
        assetClass: newPosition.assetClass,
        value: newPosition.value,
      });
      setNewPosition({ name: '', positionType: 'MutualFund', assetClass: 'Equity', value: 0, assetCategoryId: null });
      setIsAdding(false);
      await fetchAccount();
    } catch (err) {
      setError('Failed to add position');
      console.error(err);
    }
  };

  const handleUpdatePosition = async (id: number) => {
    if (!editPosition.name.trim() || editPosition.value <= 0) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      await updatePosition(id, {
        name: editPosition.name,
        positionType: editPosition.positionType,
        assetClass: editPosition.assetClass,
        value: editPosition.value,
        assetCategoryId: editPosition.assetCategoryId,
      });
      setEditingId(null);
      await fetchAccount();
    } catch (err) {
      setError('Failed to update position');
      console.error(err);
    }
  };

  const handleDeletePosition = async (id: number) => {
    if (!confirm('Are you sure you want to delete this position?')) return;
    try {
      await deletePosition(id);
      await fetchAccount();
    } catch (err) {
      setError('Failed to delete position');
      console.error(err);
    }
  };

  const startEdit = (position: Position) => {
    setEditingId(position.id);
    setEditPosition({
      name: position.name,
      positionType: position.positionType,
      assetClass: position.assetClass,
      value: position.value,
      assetCategoryId: position.assetCategoryId ?? null,
    });
  };

  const totalValue = account?.positions.reduce((sum, p) => sum + p.value, 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

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
        <h2 className="text-xl font-semibold">Positions</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Add Position
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="font-semibold mb-3">New Position</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name (e.g., VTSAX)</label>
              <input
                type="text"
                value={newPosition.name}
                onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                placeholder="Position name"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value ($)</label>
              <input
                type="number"
                value={newPosition.value || ''}
                onChange={(e) => setNewPosition({ ...newPosition, value: Number(e.target.value) })}
                placeholder="0.00"
                className="w-full border rounded-md px-3 py-2"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position Type</label>
              <select
                value={newPosition.positionType}
                onChange={(e) => setNewPosition({ ...newPosition, positionType: e.target.value as PositionType })}
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
                value={newPosition.assetClass}
                onChange={(e) => setNewPosition({ ...newPosition, assetClass: e.target.value as AssetClass })}
                className="w-full border rounded-md px-3 py-2"
              >
                {assetClasses.map((type) => (
                  <option key={type} value={type}>{assetClassLabels[type]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddPosition}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewPosition({ name: '', positionType: 'MutualFund', assetClass: 'Equity', value: 0, assetCategoryId: null }); }}
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
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Asset Class</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-right py-3 px-4">Value</th>
              <th className="text-right py-3 px-4">% of Account</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {account.positions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No positions found. Add one to get started.
                </td>
              </tr>
            ) : (
              account.positions.map((position) => (
                <tr key={position.id} className="border-b hover:bg-gray-50">
                  {editingId === position.id ? (
                    <>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editPosition.name}
                          onChange={(e) => setEditPosition({ ...editPosition, name: e.target.value })}
                          className="border rounded-md px-2 py-1 w-full"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editPosition.positionType}
                          onChange={(e) => setEditPosition({ ...editPosition, positionType: e.target.value as PositionType })}
                          className="border rounded-md px-2 py-1 w-full"
                        >
                          {positionTypes.map((type) => (
                            <option key={type} value={type}>{positionTypeLabels[type]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editPosition.assetClass}
                          onChange={(e) => setEditPosition({ ...editPosition, assetClass: e.target.value as AssetClass })}
                          className="border rounded-md px-2 py-1 w-full"
                        >
                          {assetClasses.map((type) => (
                            <option key={type} value={type}>{assetClassLabels[type]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editPosition.assetCategoryId ?? ''}
                          onChange={(e) => setEditPosition({ ...editPosition, assetCategoryId: e.target.value ? Number(e.target.value) : null })}
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
                          value={editPosition.value || ''}
                          onChange={(e) => setEditPosition({ ...editPosition, value: Number(e.target.value) })}
                          className="border rounded-md px-2 py-1 w-24 text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">-</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdatePosition(position.id)}
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
                      <td className="py-3 px-4 font-medium">{position.name}</td>
                      <td className="py-3 px-4">{positionTypeLabels[position.positionType]}</td>
                      <td className="py-3 px-4">{assetClassLabels[position.assetClass]}</td>
                      <td className="py-3 px-4">
                        {position.assetCategoryName || (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(position.value)}</td>
                      <td className="py-3 px-4 text-right">
                        {totalValue > 0 ? ((position.value / totalValue) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(position)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePosition(position.id)}
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
