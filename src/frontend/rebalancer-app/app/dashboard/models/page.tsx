'use client';

import { useEffect, useState } from 'react';
import { Model } from '@/app/lib/definitions';
import { getModels, deleteModel } from '@/app/lib/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const data = await getModels();
      setModels(data);
      setError(null);
    } catch (err) {
      setError('Failed to load models');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    try {
      await deleteModel(id);
      await fetchModels();
    } catch (err) {
      setError('Failed to delete model');
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Models</h1>
        <Link
          href="/dashboard/models/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Add Model
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Description</th>
              <th className="text-left py-3 px-4">Allocations</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No models found. Add one to get started.
                </td>
              </tr>
            ) : (
              models.map((model) => (
                <tr key={model.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{model.id}</td>
                  <td className="py-3 px-4 font-medium">{model.name}</td>
                  <td className="py-3 px-4 text-gray-600">{model.description || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {model.allocations
                        .filter((a) => {
                          // Only show top-level allocations in the list view
                          // (those where no other allocation is a parent of this one)
                          const isTopLevel = !model.allocations.some(
                            (other) => other.assetCategoryId !== a.assetCategoryId &&
                              a.assetCategoryName?.includes(other.assetCategoryName || '')
                          );
                          return true; // Show all for now, can filter later
                        })
                        .map((a) => (
                          <span
                            key={a.id}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {a.assetCategoryName || `Cat ${a.assetCategoryId}`}: {a.targetPercentage}%
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/models/${model.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(model.id)}
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
