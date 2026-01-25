'use client';

import { useEffect, useState } from 'react';
import { Account, Model, CompareResult } from '@/app/lib/definitions';
import { getAccounts, getModels, compareToModel } from '@/app/lib/api';

export default function ComparePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [accountsData, modelsData] = await Promise.all([getAccounts(), getModels()]);
        setAccounts(accountsData);
        setModels(modelsData);
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAccountToggle = (accountId: number) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
    setCompareResult(null);
  };

  const handleSelectAll = () => {
    if (selectedAccountIds.length === accounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(accounts.map((a) => a.id));
    }
    setCompareResult(null);
  };

  const handleCompare = async () => {
    if (!selectedModelId) {
      setError('Please select a model');
      return;
    }
    if (selectedAccountIds.length === 0) {
      setError('Please select at least one account');
      return;
    }

    try {
      setComparing(true);
      setError(null);
      const result = await compareToModel(selectedModelId, selectedAccountIds);
      setCompareResult(result);
    } catch (err) {
      setError('Failed to compare');
      console.error(err);
    } finally {
      setComparing(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Compare Portfolio to Model</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Account Selection */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Select Accounts</h2>
            <button
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {selectedAccountIds.length === accounts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {accounts.length === 0 ? (
            <p className="text-gray-500">No accounts found</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {accounts.map((account) => (
                <label
                  key={account.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={() => handleAccountToggle(account.id)}
                    className="rounded"
                  />
                  <span className="flex-1">{account.name}</span>
                  <span className="text-gray-500 text-sm">{account.institutionName}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Select Model</h2>
          {models.length === 0 ? (
            <p className="text-gray-500">No models found. Create one first.</p>
          ) : (
            <div className="space-y-2">
              {models.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-start gap-2 p-3 rounded border cursor-pointer ${
                    selectedModelId === model.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    checked={selectedModelId === model.id}
                    onChange={() => {
                      setSelectedModelId(model.id);
                      setCompareResult(null);
                    }}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{model.name}</div>
                    {model.description && (
                      <div className="text-sm text-gray-500">{model.description}</div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {model.allocations.map((a) => (
                        <span
                          key={a.id}
                          className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                        >
                          {a.assetCategoryName}: {a.targetPercentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleCompare}
          disabled={comparing || !selectedModelId || selectedAccountIds.length === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {comparing ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {/* Results */}
      {compareResult && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">
              Comparison Results: {compareResult.modelName}
            </h2>
            <p className="text-gray-600">
              Total Portfolio Value: ${compareResult.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-right py-3 px-4">Target %</th>
                <th className="text-right py-3 px-4">Actual %</th>
                <th className="text-right py-3 px-4">Difference %</th>
                <th className="text-right py-3 px-4">Difference $</th>
                <th className="text-left py-3 px-4">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {compareResult.comparisons.map((comp) => (
                <tr
                  key={comp.categoryId}
                  className={`border-b hover:bg-gray-50 ${
                    !comp.isLeaf ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <td
                    className={`py-3 px-4 ${comp.isLeaf ? 'font-medium' : 'font-semibold text-gray-700'}`}
                    style={{ paddingLeft: `${comp.depth * 24 + 16}px` }}
                  >
                    {comp.categoryName}
                    {!comp.isLeaf && (
                      <span className="text-xs text-gray-500 ml-2">(subtotal)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">{comp.targetPercentage.toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right">{comp.actualPercentage.toFixed(2)}%</td>
                  <td
                    className={`py-3 px-4 text-right ${
                      comp.differencePercentage > 0
                        ? 'text-green-600'
                        : comp.differencePercentage < 0
                        ? 'text-red-600'
                        : ''
                    }`}
                  >
                    {comp.differencePercentage > 0 ? '+' : ''}
                    {comp.differencePercentage.toFixed(2)}%
                  </td>
                  <td
                    className={`py-3 px-4 text-right ${
                      comp.differenceValue > 0
                        ? 'text-green-600'
                        : comp.differenceValue < 0
                        ? 'text-red-600'
                        : ''
                    }`}
                  >
                    {comp.differenceValue > 0 ? '+' : ''}
                    ${comp.differenceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm ${
                        comp.recommendation.startsWith('Buy')
                          ? 'bg-green-100 text-green-800'
                          : comp.recommendation.startsWith('Sell')
                          ? 'bg-red-100 text-red-800'
                          : comp.recommendation.includes('Over')
                          ? 'bg-amber-100 text-amber-800'
                          : comp.recommendation.includes('Under')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {comp.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {compareResult.unmappedPositions.length > 0 && (
            <div className="p-4 border-t bg-yellow-50">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Unmapped Positions ({compareResult.unmappedPositions.length})
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                These positions don&apos;t have an asset category assigned and are not included in the comparison:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {compareResult.unmappedPositions.map((pos) => (
                  <li key={pos.positionId}>
                    {pos.positionName} - ${pos.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
