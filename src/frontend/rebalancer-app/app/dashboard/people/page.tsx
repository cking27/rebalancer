'use client';

import { useEffect, useState } from 'react';
import { Person } from '@/app/lib/definitions';
import { getPeople, createPerson, updatePerson, deletePerson } from '@/app/lib/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const data = await getPeople();
      setPeople(data);
      setError(null);
    } catch (err) {
      setError('Failed to load people');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await createPerson({ name: newName });
      setNewName('');
      setIsAdding(false);
      await fetchPeople();
    } catch (err) {
      setError('Failed to add person');
      console.error(err);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await updatePerson(id, { name: editName });
      setEditingId(null);
      setEditName('');
      await fetchPeople();
    } catch (err) {
      setError('Failed to update person');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this person?')) return;
    try {
      await deletePerson(id);
      await fetchPeople();
    } catch (err) {
      setError('Failed to delete person');
      console.error(err);
    }
  };

  const startEdit = (person: Person) => {
    setEditingId(person.id);
    setEditName(person.name);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">People</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Add Person
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name"
              className="flex-1 border rounded-md px-3 py-2"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewName(''); }}
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
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  No people found. Add one to get started.
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr key={person.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{person.id}</td>
                  <td className="py-3 px-4">
                    {editingId === person.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border rounded-md px-2 py-1 w-full"
                        autoFocus
                      />
                    ) : (
                      person.name
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingId === person.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUpdate(person.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditName(''); }}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(person)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
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
