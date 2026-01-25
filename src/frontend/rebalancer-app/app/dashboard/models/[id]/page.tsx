'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AssetCategoryTree, CreateModelAllocationRequest } from '@/app/lib/definitions';
import {
  getModel,
  getAssetCategoriesTree,
  createModel,
  updateModel,
} from '@/app/lib/api';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type CategoryAllocationState = {
  percentage: number;
  expanded: boolean;
};

export default function ModelEditPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  const modelId = isNew ? null : Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryTree, setCategoryTree] = useState<AssetCategoryTree[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Map of categoryId -> { percentage, expanded }
  const [allocations, setAllocations] = useState<Map<number, CategoryAllocationState>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const tree = await getAssetCategoriesTree();
        setCategoryTree(tree);

        if (!isNew && modelId) {
          const model = await getModel(modelId);
          setName(model.name);
          setDescription(model.description || '');

          // Initialize allocations from model
          const allocs = new Map<number, CategoryAllocationState>();
          model.allocations.forEach((a) => {
            allocs.set(a.assetCategoryId, {
              percentage: a.targetPercentage,
              expanded: true
            });
          });
          setAllocations(allocs);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isNew, modelId]);

  // Get allocation for a category (default to 0)
  const getAllocation = (categoryId: number): number => {
    return allocations.get(categoryId)?.percentage ?? 0;
  };

  // Check if category is expanded
  const isExpanded = (categoryId: number): boolean => {
    return allocations.get(categoryId)?.expanded ?? false;
  };

  // Set allocation for a category
  const setAllocation = (categoryId: number, percentage: number) => {
    setAllocations((prev) => {
      const next = new Map(prev);
      const existing = next.get(categoryId);
      next.set(categoryId, {
        percentage,
        expanded: existing?.expanded ?? false
      });
      return next;
    });
  };

  // Toggle expansion of a category
  const toggleExpanded = (categoryId: number) => {
    setAllocations((prev) => {
      const next = new Map(prev);
      const existing = next.get(categoryId);
      next.set(categoryId, {
        percentage: existing?.percentage ?? 0,
        expanded: !(existing?.expanded ?? false)
      });
      return next;
    });
  };

  // Calculate total percentage at a given level (for children of a parent, or top-level)
  const calculateLevelTotal = (categories: AssetCategoryTree[]): number => {
    return categories.reduce((sum, cat) => sum + getAllocation(cat.id), 0);
  };

  // Validate allocations at all levels
  const validateAllocations = (): string | null => {
    // Check top-level total
    const topLevelTotal = calculateLevelTotal(categoryTree);
    if (topLevelTotal > 0 && Math.abs(topLevelTotal - 100) > 0.01) {
      return `Top-level allocations must sum to 100%. Current: ${topLevelTotal.toFixed(2)}%`;
    }

    // Check each parent's children sum to 100% (if parent has allocation and children have allocations)
    const checkChildren = (categories: AssetCategoryTree[]): string | null => {
      for (const cat of categories) {
        if (cat.children.length > 0) {
          const childrenTotal = calculateLevelTotal(cat.children);
          const parentAlloc = getAllocation(cat.id);

          // Only validate if parent has allocation AND at least one child has allocation
          const hasChildAllocations = cat.children.some(c => getAllocation(c.id) > 0);

          if (parentAlloc > 0 && hasChildAllocations && Math.abs(childrenTotal - 100) > 0.01) {
            return `${cat.name} sub-allocations must sum to 100%. Current: ${childrenTotal.toFixed(2)}%`;
          }

          // Recurse into children
          const childError = checkChildren(cat.children);
          if (childError) return childError;
        }
      }
      return null;
    };

    return checkChildren(categoryTree);
  };

  // Calculate effective percentage for a category (multiply through ancestry)
  const calculateEffectivePercentage = (
    categoryId: number,
    ancestorEffective: number = 100
  ): number => {
    const percentage = getAllocation(categoryId);
    return (ancestorEffective * percentage) / 100;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const validationError = validateAllocations();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      // Convert allocations map to array, only including non-zero allocations
      const allocationList: CreateModelAllocationRequest[] = [];
      allocations.forEach((state, categoryId) => {
        if (state.percentage > 0) {
          allocationList.push({
            assetCategoryId: categoryId,
            targetPercentage: state.percentage,
          });
        }
      });

      const data = {
        name,
        description: description || null,
        allocations: allocationList,
      };

      if (isNew) {
        await createModel(data);
      } else if (modelId) {
        await updateModel(modelId, data);
      }

      router.push('/dashboard/models');
    } catch (err) {
      setError('Failed to save model');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Render a category row with indentation
  const renderCategory = (
    category: AssetCategoryTree,
    depth: number = 0,
    parentEffective: number = 100
  ): React.ReactNode => {
    const hasChildren = category.children.length > 0;
    const expanded = isExpanded(category.id);
    const percentage = getAllocation(category.id);
    const effectivePercentage = (parentEffective * percentage) / 100;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center py-2 border-b hover:bg-gray-50 ${depth > 0 ? 'bg-gray-50/50' : ''}`}
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
        >
          {/* Expand/collapse toggle */}
          <div className="w-6 mr-2">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                {expanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Category name */}
          <div className="flex-1 font-medium">
            {category.name}
            {depth > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                (% of parent)
              </span>
            )}
          </div>

          {/* Percentage input */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={percentage || ''}
              onChange={(e) => setAllocation(category.id, Number(e.target.value) || 0)}
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
              className="border rounded-md px-2 py-1 w-20 text-right"
            />
            <span className="text-gray-600 w-4">%</span>
          </div>

          {/* Effective percentage (if has parent allocation) */}
          {depth > 0 && percentage > 0 && (
            <div className="ml-4 text-sm text-gray-500 w-32 text-right">
              = {effectivePercentage.toFixed(2)}% of total
            </div>
          )}
          {depth === 0 && percentage > 0 && (
            <div className="ml-4 text-sm text-gray-500 w-32 text-right">
              {/* placeholder for alignment */}
            </div>
          )}
        </div>

        {/* Render children if expanded */}
        {hasChildren && expanded && (
          <div>
            {category.children.map((child) =>
              renderCategory(child, depth + 1, effectivePercentage)
            )}
            {/* Show subtotal for children */}
            <div
              className="flex items-center py-1 bg-gray-100 text-sm border-b"
              style={{ paddingLeft: `${(depth + 1) * 24 + 8}px` }}
            >
              <div className="w-6 mr-2"></div>
              <div className="flex-1 text-gray-600 italic">
                {category.name} subtotal:
              </div>
              <div className={`font-semibold ${
                Math.abs(calculateLevelTotal(category.children) - 100) > 0.01
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}>
                {calculateLevelTotal(category.children).toFixed(2)}%
              </div>
              <div className="w-32 ml-4"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-4">Loading...</div>;

  const topLevelTotal = calculateLevelTotal(categoryTree);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'Create Model' : 'Edit Model'}</h1>
        <Link
          href="/dashboard/models"
          className="text-gray-600 hover:text-gray-800"
        >
          Back to Models
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 80/20 Growth"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Allocations</h2>
            <div className="text-sm text-gray-500">
              Set top-level percentages (must sum to 100%), then expand to set sub-allocations
            </div>
          </div>

          <div className="border rounded-md">
            {/* Header */}
            <div className="flex items-center py-2 px-2 bg-gray-100 border-b font-semibold text-sm">
              <div className="w-6 mr-2"></div>
              <div className="flex-1">Category</div>
              <div className="w-24 text-right">Target %</div>
              <div className="w-32 ml-4 text-right">Effective</div>
            </div>

            {/* Category tree */}
            {categoryTree.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                No categories defined. Create categories first.
              </div>
            ) : (
              categoryTree.map((cat) => renderCategory(cat))
            )}

            {/* Top-level total */}
            {categoryTree.length > 0 && (
              <div className="flex items-center py-2 px-2 bg-gray-200 font-semibold">
                <div className="w-6 mr-2"></div>
                <div className="flex-1">Total</div>
                <div className={`w-24 text-right ${
                  Math.abs(topLevelTotal - 100) > 0.01 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {topLevelTotal.toFixed(2)}%
                </div>
                <div className="w-32 ml-4"></div>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Child percentages are relative to their parent. For example, if Equity is 80% and US Equity is 60% (of Equity),
            the effective allocation is 48% of total portfolio.
          </p>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {saving ? 'Saving...' : 'Save Model'}
          </button>
          <Link
            href="/dashboard/models"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
