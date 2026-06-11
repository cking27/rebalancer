'use client';

import { useEffect, useState, Fragment } from 'react';
import { AssetCategory } from '@/app/lib/definitions';
import {
  getAssetCategories,
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
} from '@/app/lib/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', parentId: null as number | null, displayOrder: 0 });
  const [newForm, setNewForm] = useState({ name: '', parentId: null as number | null, displayOrder: 0 });
  const [isAdding, setIsAdding] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAssetCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!newForm.name.trim()) return;
    try {
      await createAssetCategory({
        name: newForm.name,
        parentId: newForm.parentId,
        displayOrder: newForm.displayOrder,
      });
      setNewForm({ name: '', parentId: null, displayOrder: 0 });
      setIsAdding(false);
      await fetchCategories();
    } catch (err) {
      setError('Failed to add category');
      console.error(err);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editForm.name.trim()) return;
    try {
      await updateAssetCategory(id, {
        name: editForm.name,
        parentId: editForm.parentId,
        displayOrder: editForm.displayOrder,
      });
      setEditingId(null);
      await fetchCategories();
    } catch (err) {
      setError('Failed to update category');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteAssetCategory(id);
      await fetchCategories();
    } catch (err) {
      setError('Failed to delete category. It may have child categories or positions assigned.');
      console.error(err);
    }
  };

  const startEdit = (category: AssetCategory) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      parentId: category.parentId ?? null,
      displayOrder: category.displayOrder,
    });
  };

  const getParentName = (parentId: number | null | undefined) => {
    if (!parentId) return '-';
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : '-';
  };

  // Organize categories hierarchically for display
  const topLevel = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: number) => categories.filter((c) => c.parentId === parentId);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Asset Categories</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              placeholder="Category name"
              className="border rounded-md px-3 py-2"
              autoFocus
            />
            <select
              value={newForm.parentId ?? ''}
              onChange={(e) =>
                setNewForm({ ...newForm, parentId: e.target.value ? Number(e.target.value) : null })
              }
              className="border rounded-md px-3 py-2"
            >
              <option value="">No parent (top-level)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newForm.displayOrder}
              onChange={(e) => setNewForm({ ...newForm, displayOrder: Number(e.target.value) })}
              placeholder="Display order"
              className="border rounded-md px-3 py-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewForm({ name: '', parentId: null, displayOrder: 0 });
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Parent</th>
              <th className="text-left py-3 px-4">Order</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No categories found. Add one to get started.
                </td>
              </tr>
            ) : (
              <>
                {topLevel.map((category) => (
                  <Fragment key={category.id}>
                    <CategoryRow
                      category={category}
                      categories={categories}
                      editingId={editingId}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      startEdit={startEdit}
                      handleUpdate={handleUpdate}
                      handleDelete={handleDelete}
                      setEditingId={setEditingId}
                      getParentName={getParentName}
                      indent={0}
                    />
                    {getChildren(category.id).map((child) => (
                      <CategoryRow
                        key={child.id}
                        category={child}
                        categories={categories}
                        editingId={editingId}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        startEdit={startEdit}
                        handleUpdate={handleUpdate}
                        handleDelete={handleDelete}
                        setEditingId={setEditingId}
                        getParentName={getParentName}
                        indent={1}
                      />
                    ))}
                  </Fragment>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  categories,
  editingId,
  editForm,
  setEditForm,
  startEdit,
  handleUpdate,
  handleDelete,
  setEditingId,
  getParentName,
  indent,
}: {
  category: AssetCategory;
  categories: AssetCategory[];
  editingId: number | null;
  editForm: { name: string; parentId: number | null; displayOrder: number };
  setEditForm: (form: { name: string; parentId: number | null; displayOrder: number }) => void;
  startEdit: (category: AssetCategory) => void;
  handleUpdate: (id: number) => void;
  handleDelete: (id: number) => void;
  setEditingId: (id: number | null) => void;
  getParentName: (parentId: number | null | undefined) => string;
  indent: number;
}) {
  const isEditing = editingId === category.id;

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">{category.id}</td>
      <td className="py-3 px-4">
        {isEditing ? (
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="border rounded-md px-2 py-1 w-full"
            autoFocus
          />
        ) : (
          <span style={{ marginLeft: `${indent * 24}px` }}>
            {indent > 0 && '└ '}
            {category.name}
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        {isEditing ? (
          <select
            value={editForm.parentId ?? ''}
            onChange={(e) =>
              setEditForm({ ...editForm, parentId: e.target.value ? Number(e.target.value) : null })
            }
            className="border rounded-md px-2 py-1"
          >
            <option value="">No parent</option>
            {categories
              .filter((c) => c.id !== category.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        ) : (
          getParentName(category.parentId)
        )}
      </td>
      <td className="py-3 px-4">
        {isEditing ? (
          <input
            type="number"
            value={editForm.displayOrder}
            onChange={(e) => setEditForm({ ...editForm, displayOrder: Number(e.target.value) })}
            className="border rounded-md px-2 py-1 w-20"
          />
        ) : (
          category.displayOrder
        )}
      </td>
      <td className="py-3 px-4 text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleUpdate(category.id)}
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
        ) : (
          <div className="flex justify-end gap-2">
            <button onClick={() => startEdit(category)} className="text-blue-600 hover:text-blue-800">
              <PencilIcon className="w-5 h-5" />
            </button>
            <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-800">
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
