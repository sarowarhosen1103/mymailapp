"use client";

import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, X } from 'lucide-react';

interface Contact {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  contacts: any[];
  updatedAt: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contacts: [] as string[]
  });

  useEffect(() => {
    fetchGroups();
    fetchContacts();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description,
        contacts: group.contacts.map(c => typeof c === 'string' ? c : c._id)
      });
    } else {
      setEditingGroup(null);
      setFormData({ name: '', description: '', contacts: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingGroup ? `/api/groups/${editingGroup._id}` : '/api/groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchGroups();
        handleCloseModal();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save group');
      }
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(groups.filter(g => g._id !== id));
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const toggleContact = (id: string) => {
    setFormData(prev => {
      const current = prev.contacts;
      return {
        ...prev,
        contacts: current.includes(id) ? current.filter(c => c !== id) : [...current, id]
      };
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
          Contact Groups
        </h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-5 w-5" />
          Create Group
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700">
          <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No groups found</h3>
          <p className="text-slate-400 mb-6">Create groups to easily send bulk emails to specific contacts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group._id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 relative group">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(group)} className="text-slate-400 hover:text-indigo-400">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(group._id)} className="text-slate-400 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-1">{group.description || 'No description'}</p>
              <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center text-sm">
                <span className="text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full font-medium">
                  {group.contacts.length} Contacts
                </span>
                <span className="text-slate-500">
                  Updated {new Date(group.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">{editingGroup ? 'Edit Group' : 'Create Group'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Contacts ({formData.contacts.length} selected)</label>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-60 overflow-y-auto">
                    {contacts.length === 0 ? (
                      <p className="p-4 text-center text-slate-400">No contacts available. Please add contacts first.</p>
                    ) : (
                      contacts.map(contact => (
                        <label key={contact._id} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={formData.contacts.includes(contact._id)}
                            onChange={() => toggleContact(contact._id)}
                            className="rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-600"
                          />
                          <div>
                            <p className="text-sm text-white font-medium">
                              {contact.firstName ? `${contact.firstName} ${contact.lastName || ''}` : 'No Name'}
                            </p>
                            <p className="text-xs text-slate-400">{contact.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20">
                  {editingGroup ? 'Save Changes' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
