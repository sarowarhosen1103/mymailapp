'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, Upload, Loader2, AlertCircle, FileUp, CheckCircle2, ArrowRight, Trash2, Edit2, X, Plus, FolderPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return text || '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

interface Contact {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  ceoName?: string;
  companyEmail?: string;
  companyNumber?: string;
  website?: string;
  status: string;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 1 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; ids: string[] }>({ isOpen: false, ids: [] });
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '' });
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  // Single Contact State
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    ceoName: '',
    companyEmail: '',
    companyNumber: '',
    website: ''
  });
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups'>('contacts');
  
  // Groups State
  const [groups, setGroups] = useState<any[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    contacts: [] as string[]
  });

  // Mapping State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([]);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  
  const [mapping, setMapping] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    ceoName: '',
    companyEmail: '',
    companyNumber: '',
    website: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload group options
  const [uploadGroupOption, setUploadGroupOption] = useState<'none' | 'create' | 'existing'>('none');
  const [uploadNewGroupName, setUploadNewGroupName] = useState('');
  const [uploadNewGroupDesc, setUploadNewGroupDesc] = useState('');
  const [uploadExistingGroupId, setUploadExistingGroupId] = useState('');

  // Add selected contacts to existing group
  const [addToGroupModal, setAddToGroupModal] = useState(false);
  const [addToGroupId, setAddToGroupId] = useState('');
  const [isAddingToGroup, setIsAddingToGroup] = useState(false);

  const fetchContacts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?page=${page}&limit=100`);
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching contacts', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, []);

  // Step 1: Handle File Selection and Extract Headers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadMessage(null);

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      // Read only the first few rows to get headers
      Papa.parse(file, {
        header: true,
        preview: 5,
        skipEmptyLines: true,
        complete: (results) => {
          setTotalRows(results.data.length);
          handleParsedData(results.meta.fields || [], results.data);
        },
        error: (error) => {
          setUploadMessage({ type: 'error', text: `CSV Parse Error: ${error.message}` });
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[];
          const previewRows = jsonData.slice(1, 6).map((row: any) => {
            const obj: any = {};
            headers.forEach((h, i) => {
              obj[h] = row[i];
            });
            return obj;
          });
          setTotalRows(jsonData.length - 1);
          handleParsedData(headers, previewRows);
        } else {
          setUploadMessage({ type: 'error', text: 'The Excel file is empty.' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setUploadMessage({ type: 'error', text: 'Unsupported file format. Please upload CSV or Excel.' });
    }

    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleParsedData = (headers: string[], previewData: any[]) => {
    if (headers.length > 0) {
      setCsvHeaders(headers);
      
      // Auto-guess mapping
      const guessEmail = headers.find(h => h.toLowerCase().includes('email') && !h.toLowerCase().includes('company')) || '';
      const guessFirstName = headers.find(h => h.toLowerCase().includes('first') || h.toLowerCase() === 'name') || '';
      const guessLastName = headers.find(h => h.toLowerCase().includes('last')) || '';
      const guessCompanyName = headers.find(h => h.toLowerCase().includes('company') && h.toLowerCase().includes('name')) || headers.find(h => h.toLowerCase() === 'company') || '';
      const guessCeoName = headers.find(h => h.toLowerCase().includes('ceo')) || '';
      const guessCompanyEmail = headers.find(h => h.toLowerCase().includes('company') && h.toLowerCase().includes('email')) || '';
      const guessCompanyNumber = headers.find(h => h.toLowerCase().includes('company') && (h.toLowerCase().includes('number') || h.toLowerCase().includes('phone'))) || '';
      const guessWebsite = headers.find(h => h.toLowerCase().includes('website') || h.toLowerCase().includes('site') || h.toLowerCase().includes('url')) || '';
      
      setMapping({
        email: guessEmail,
        firstName: guessFirstName,
        lastName: guessLastName,
        companyName: guessCompanyName,
        ceoName: guessCeoName,
        companyEmail: guessCompanyEmail,
        companyNumber: guessCompanyNumber,
        website: guessWebsite
      });

      setCsvPreviewData(previewData);
      setIsMappingModalOpen(true);
    } else {
      setUploadMessage({ type: 'error', text: 'Could not detect any columns in the file.' });
    }
  };

  // Step 2: Submit mapped data to backend
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    if (!mapping.email) {
      setUploadMessage({ type: 'error', text: 'You must select a column for the Email field.' });
      return;
    }
    if (uploadGroupOption === 'create' && !uploadNewGroupName.trim()) {
      setUploadMessage({ type: 'error', text: 'Please enter a name for the new group.' });
      return;
    }
    if (uploadGroupOption === 'existing' && !uploadExistingGroupId) {
      setUploadMessage({ type: 'error', text: 'Please select an existing group.' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      const res = await fetch('/api/contacts/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        let errorMsg = data.error || 'Failed to upload contacts';
        if (data.details?.length > 0) errorMsg += `: ${data.details[0].error} (Row ${data.details[0].row})`;
        setUploadMessage({ type: 'error', text: errorMsg });
        return;
      }

      const total = data.insertedCount + data.updatedCount;
      let groupMsg = '';

      // Handle group assignment
      if (uploadGroupOption === 'create' && data.contactIds?.length > 0) {
        const groupRes = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: uploadNewGroupName.trim(), description: uploadNewGroupDesc.trim(), contacts: data.contactIds }),
        });
        if (groupRes.ok) {
          groupMsg = ` New group "${uploadNewGroupName.trim()}" created.`;
          await fetchGroups();
        }
      } else if (uploadGroupOption === 'existing' && data.contactIds?.length > 0) {
        const patchRes = await fetch(`/api/groups/${uploadExistingGroupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactIds: data.contactIds }),
        });
        if (patchRes.ok) {
          const grp = groups.find(g => g._id === uploadExistingGroupId);
          groupMsg = ` Added to group "${grp?.name || 'selected group'}".`;
          await fetchGroups();
        }
      }

      setUploadMessage({ type: 'success', text: `Successfully imported ${total} contacts.${groupMsg}` });
      setIsMappingModalOpen(false);
      setSelectedFile(null);
      setUploadGroupOption('none');
      setUploadNewGroupName('');
      setUploadNewGroupDesc('');
      setUploadExistingGroupId('');
      fetchContacts();
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'An unexpected error occurred during upload.' });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c._id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (ids: string[]) => {
    setDeleteModal({ isOpen: true, ids });
  };

  const confirmDelete = async () => {
    const ids = deleteModal.ids;
    setIsDeleting(true);
    setDeleteModal({ isOpen: false, ids: [] });
    
    try {
      const res = await fetch('/api/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (res.ok) {
        setContacts(contacts.filter(c => !ids.includes(c._id)));
        setSelectedIds(new Set());
        setUploadMessage({ type: 'success', text: `${ids.length} contact${ids.length > 1 ? 's' : ''} deleted successfully.` });
      } else {
        const data = await res.json();
        setUploadMessage({ type: 'error', text: data.error || 'Failed to delete contacts' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'An unexpected error occurred during deletion.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingGroup(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupFormData.name,
          description: groupFormData.description,
          contacts: Array.from(selectedIds)
        })
      });
      if (res.ok) {
        setUploadMessage({ type: 'success', text: `Contact group created with ${selectedIds.size} contacts.` });
        setCreateGroupModal(false);
        setGroupFormData({ name: '', description: '' });
        setSelectedIds(new Set());
      } else {
        const data = await res.json();
        setUploadMessage({ type: 'error', text: data.error || 'Failed to create group' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleOpenGroupModal = (group?: any) => {
    if (group) {
      setEditingGroup(group);
      setGroupData({
        name: group.name,
        description: group.description || '',
        contacts: group.contacts.map((c: any) => typeof c === 'string' ? c : c._id)
      });
    } else {
      setEditingGroup(null);
      setGroupData({ name: '', description: '', contacts: [] });
    }
    setIsGroupModalOpen(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingGroup ? `/api/groups/${editingGroup._id}` : '/api/groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      });

      if (res.ok) {
        await fetchGroups();
        setIsGroupModalOpen(false);
        setEditingGroup(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save group');
      }
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(groups.filter(g => g._id !== id));
      } else {
        alert('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleAddToGroup = async () => {
    if (!addToGroupId) return;
    setIsAddingToGroup(true);
    try {
      const res = await fetch(`/api/groups/${addToGroupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        const grp = groups.find(g => g._id === addToGroupId);
        setUploadMessage({ type: 'success', text: `Added ${selectedIds.size} contact(s) to "${grp?.name || 'group'}".` });
        setAddToGroupModal(false);
        setAddToGroupId('');
        setSelectedIds(new Set());
        await fetchGroups();
      } else {
        const d = await res.json();
        setUploadMessage({ type: 'error', text: d.error || 'Failed to add contacts to group' });
      }
    } catch {
      setUploadMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsAddingToGroup(false);
    }
  };

  const toggleGroupContact = (id: string) => {
    setGroupData(prev => {
      const current = prev.contacts;
      return {
        ...prev,
        contacts: current.includes(id) ? current.filter(c => c !== id) : [...current, id]
      };
    });
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFormData.email) return;
    setIsSavingContact(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData)
      });
      if (res.ok) {
        setUploadMessage({ type: 'success', text: 'Contact added successfully.' });
        setIsAddContactModalOpen(false);
        setContactFormData({
          email: '',
          firstName: '',
          lastName: '',
          companyName: '',
          ceoName: '',
          companyEmail: '',
          companyNumber: '',
          website: ''
        });
        fetchContacts(pagination.page);
      } else {
        const data = await res.json();
        setUploadMessage({ type: 'error', text: data.error || 'Failed to add contact' });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsSavingContact(false);
    }
  };

  return (
    <div>
      {/* Add Single Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-emerald-400" />
                  Add New Contact
                </h2>
                <button onClick={() => setIsAddContactModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddContactSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={contactFormData.firstName}
                    onChange={(e) => setContactFormData({...contactFormData, firstName: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={contactFormData.lastName}
                    onChange={(e) => setContactFormData({...contactFormData, lastName: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={contactFormData.companyName}
                    onChange={(e) => setContactFormData({...contactFormData, companyName: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">CEO Name</label>
                  <input
                    type="text"
                    value={contactFormData.ceoName}
                    onChange={(e) => setContactFormData({...contactFormData, ceoName: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company Email</label>
                  <input
                    type="email"
                    value={contactFormData.companyEmail}
                    onChange={(e) => setContactFormData({...contactFormData, companyEmail: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company Phone</label>
                  <input
                    type="text"
                    value={contactFormData.companyNumber}
                    onChange={(e) => setContactFormData({...contactFormData, companyNumber: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Website</label>
                  <input
                    type="url"
                    value={contactFormData.website}
                    onChange={(e) => setContactFormData({...contactFormData, website: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg flex items-center gap-2"
                >
                  {isSavingContact && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-500" />
            Contacts
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage your mailing list. Upload a CSV file and map your columns to add contacts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700 mt-6 sm:mt-0">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'contacts' 
                ? 'bg-indigo-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            All Contacts
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'groups' 
                ? 'bg-indigo-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Groups
          </button>
        </div>

        <div className="mt-4 sm:ml-16 sm:mt-0 flex gap-3">
          {activeTab === 'contacts' ? (
            <>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
              />
              <button
                onClick={() => setIsAddContactModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </button>
              <button
                onClick={triggerFileInput}
                className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </button>
              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={() => setCreateGroupModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Create Group ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => { setAddToGroupId(''); setAddToGroupModal(true); }}
                    className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Add to Group ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => handleDelete(Array.from(selectedIds))}
                    disabled={isDeleting}
                    className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete ({selectedIds.size})
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              onClick={() => handleOpenGroupModal()}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </button>
          )}
        </div>
      </div>

      {uploadMessage && !isMappingModalOpen && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${uploadMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {uploadMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{uploadMessage.text}</p>
        </div>
      )}

      {/* Column Mapping Modal */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Map Your Columns</h2>
                <p className="text-sm text-slate-400 mt-1">Select which columns from your CSV match our fields.</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-center shrink-0">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Contacts Detected</p>
                <p className="text-lg font-black text-white">{totalRows.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-grow">
              {uploadMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {uploadMessage.text}
                </div>
              )}

              {/* Data Preview */}
              {csvPreviewData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-2">Data Preview (First 3 Rows)</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="min-w-full divide-y divide-slate-700 bg-slate-800/50">
                      <thead className="bg-slate-900/50">
                        <tr>
                          {csvHeaders.slice(0, 5).map((header, idx) => (
                            <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-slate-300">
                              {header}
                            </th>
                          ))}
                          {csvHeaders.length > 5 && <th className="px-3 py-2 text-left text-xs font-medium text-slate-300">...</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {csvPreviewData.slice(0, 3).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {csvHeaders.slice(0, 5).map((header, colIndex) => (
                              <td key={colIndex} className="px-3 py-2 text-xs text-slate-400 truncate max-w-[120px]">
                                {row[header] || '-'}
                              </td>
                            ))}
                            {csvHeaders.length > 5 && <td className="px-3 py-2 text-xs text-slate-400">...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5 text-sm font-medium text-slate-300">Database Field</div>
                <div className="col-span-2 flex justify-center text-slate-500"><ArrowRight className="h-4 w-4"/></div>
                <div className="col-span-5 text-sm font-medium text-slate-300">Your CSV Column</div>
              </div>

              {/* Email Mapping */}
              <div className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="col-span-5 text-sm font-semibold text-white">Email <span className="text-red-400">*</span></div>
                <div className="col-span-2 flex justify-center text-slate-500"></div>
                <div className="col-span-5">
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={mapping.email}
                    onChange={(e) => setMapping({...mapping, email: e.target.value})}
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* First Name Mapping */}
              <div className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="col-span-5 text-sm font-semibold text-white">First Name</div>
                <div className="col-span-2 flex justify-center text-slate-500"></div>
                <div className="col-span-5">
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={mapping.firstName}
                    onChange={(e) => setMapping({...mapping, firstName: e.target.value})}
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Last Name Mapping */}
              <div className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="col-span-5 text-sm font-semibold text-white">Last Name</div>
                <div className="col-span-2 flex justify-center text-slate-500"></div>
                <div className="col-span-5">
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={mapping.lastName}
                    onChange={(e) => setMapping({...mapping, lastName: e.target.value})}
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Company Name Mapping */}
              <div className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="col-span-5 text-sm font-semibold text-white">Company Name</div>
                <div className="col-span-2 flex justify-center text-slate-500"></div>
                <div className="col-span-5">
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={mapping.companyName}
                    onChange={(e) => setMapping({...mapping, companyName: e.target.value})}
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CEO Name Mapping */}
              <div className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="col-span-5 text-sm font-semibold text-white">CEO Name</div>
                <div className="col-span-2 flex justify-center text-slate-500"></div>
                <div className="col-span-5">
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={mapping.ceoName}
                    onChange={(e) => setMapping({...mapping, ceoName: e.target.value})}
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Email Mapping */}
              <div className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="col-span-5 text-sm font-semibold text-white">Company Email</div>
                <div className="col-span-2 flex justify-center text-slate-500"></div>
                <div className="col-span-5">
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={mapping.companyEmail}
                    onChange={(e) => setMapping({...mapping, companyEmail: e.target.value})}
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Number Mapping */}
              <div className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="col-span-5 text-sm font-semibold text-white">Company Number</div>
                <div className="col-span-2 flex justify-center text-slate-500"></div>
                <div className="col-span-5">
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={mapping.companyNumber}
                    onChange={(e) => setMapping({...mapping, companyNumber: e.target.value})}
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Website Mapping */}
              <div className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="col-span-5 text-sm font-semibold text-white">Website</div>
                <div className="col-span-2 flex justify-center text-slate-500"></div>
                <div className="col-span-5">
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                    value={mapping.website}
                    onChange={(e) => setMapping({...mapping, website: e.target.value})}
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-4 shrink-0">
              {/* Group Assignment Options */}
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">📁 Add to Group (optional)</p>
                <div className="flex gap-2 flex-wrap">
                  {(['none', 'create', 'existing'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setUploadGroupOption(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        uploadGroupOption === opt
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {opt === 'none' ? 'No Group' : opt === 'create' ? '+ Create New Group' : 'Add to Existing Group'}
                    </button>
                  ))}
                </div>

                {uploadGroupOption === 'create' && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Group name *"
                      value={uploadNewGroupName}
                      onChange={e => setUploadNewGroupName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={uploadNewGroupDesc}
                      onChange={e => setUploadNewGroupDesc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}

                {uploadGroupOption === 'existing' && (
                  <div className="mt-3">
                    <select
                      value={uploadExistingGroupId}
                      onChange={e => setUploadExistingGroupId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-- Select a group --</option>
                      {groups.map((g: any) => (
                        <option key={g._id} value={g._id}>{g.name} ({g.contacts.length} contacts)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsMappingModalOpen(false);
                    setSelectedFile(null);
                    setUploadMessage(null);
                    setUploadGroupOption('none');
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={isUploading || !mapping.email}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg active:scale-95"
                >
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isUploading ? 'Uploading...' : `Import ${totalRows.toLocaleString()} Contacts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6">
            <div className="flex items-center gap-4 mb-4 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Delete Contacts</h2>
            </div>
            
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete {deleteModal.ids.length} selected contact{deleteModal.ids.length > 1 ? 's' : ''}? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, ids: [] })}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md flex items-center gap-2"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Existing Group Modal */}
      {addToGroupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6">
            <div className="flex items-center gap-4 mb-4 text-violet-400">
              <div className="p-3 bg-violet-500/10 rounded-full">
                <FolderPlus className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Add to Existing Group</h2>
            </div>

            <p className="text-slate-400 mb-4 text-sm">
              Adding <strong className="text-white">{selectedIds.size} contact{selectedIds.size > 1 ? 's' : ''}</strong> to a group. Duplicates will be ignored automatically.
            </p>

            <select
              value={addToGroupId}
              onChange={e => setAddToGroupId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-violet-500 outline-none mb-6"
            >
              <option value="">-- Select a group --</option>
              {groups.map((g: any) => (
                <option key={g._id} value={g._id}>{g.name} ({g.contacts.length} contacts)</option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setAddToGroupModal(false); setAddToGroupId(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToGroup}
                disabled={!addToGroupId || isAddingToGroup}
                className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md"
              >
                {isAddingToGroup && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAddingToGroup ? 'Adding...' : 'Add to Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {createGroupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6">
            <div className="flex items-center gap-4 mb-4 text-emerald-400">
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Create Contact Group</h2>
            </div>
            
            <p className="text-slate-400 mb-6 text-sm">
              You are creating a new group with <strong>{selectedIds.size} selected contacts</strong>.
            </p>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({...groupFormData, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Q3 Newsletter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({...groupFormData, description: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Optional"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setCreateGroupModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreatingGroup}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md flex items-center gap-2"
                >
                  {isCreatingGroup && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : activeTab === 'contacts' ? (
        contacts.length === 0 ? (
          <div className="text-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 py-16 px-6">
            <Users className="mx-auto h-12 w-12 text-slate-500 mb-4" />
            <h3 className="text-sm font-semibold text-white">No contacts yet</h3>
            <p className="mt-1 text-sm text-slate-400">Get started by uploading a CSV file of your contacts.</p>
            <div className="mt-6">
              <button
                onClick={triggerFileInput}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 transition-colors"
              >
                <FileUp className="h-4 w-4" />
                Upload Contacts
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                        checked={contacts.length > 0 && selectedIds.size === contacts.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th scope="col" className="py-3.5 pr-3 text-left text-sm font-semibold text-slate-300">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">
                      First Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">
                      Last Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">
                      Added On
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-transparent">
                  {contacts.map((contact) => (
                    <tr key={contact._id} className={`${selectedIds.has(contact._id) ? 'bg-indigo-500/5' : ''} hover:bg-slate-800/80 transition-colors`}>
                      <td className="relative px-7 sm:w-12 sm:px-6">
                        {selectedIds.has(contact._id) && (
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500" />
                        )}
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                          checked={selectedIds.has(contact._id)}
                          onChange={() => toggleSelectOne(contact._id)}
                        />
                      </td>
                      <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-white">
                        {contact.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                        {truncateText(contact.firstName || '-', 30)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                        {truncateText(contact.lastName || '-', 30)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          contact.status === 'subscribed' ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 
                          contact.status === 'unsubscribed' ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 
                          'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleDelete([contact._id])}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-400/10"
                          title="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-slate-700 bg-slate-900/30">
                <div className="text-sm text-slate-400">
                  Showing <span className="text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-white">{pagination.total}</span> contacts
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchContacts(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(pagination.pages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 || 
                        pageNum === pagination.pages || 
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchContacts(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              pagination.page === pageNum
                                ? 'bg-indigo-500 text-white shadow-lg'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        (pageNum === 2 && pagination.page > 3) || 
                        (pageNum === pagination.pages - 1 && pagination.page < pagination.pages - 2)
                      ) {
                        return <span key={pageNum} className="text-slate-600 px-1">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <button
                    onClick={() => fetchContacts(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages || loading}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Groups Tab Content */
        groups.length === 0 ? (
          <div className="text-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 py-16 px-6">
            <Users className="mx-auto h-12 w-12 text-slate-500 mb-4" />
            <h3 className="text-sm font-semibold text-white">No groups yet</h3>
            <p className="mt-1 text-sm text-slate-400">Organize your contacts into groups for targeted campaigns.</p>
            <div className="mt-6">
              <button
                onClick={() => handleOpenGroupModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create First Group
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <div key={group._id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 relative group flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-white">{truncateText(group.name, 30)}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenGroupModal(group)} className="text-slate-400 hover:text-indigo-400">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteGroup(group._id)} className="text-slate-400 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-1">{group.description || 'No description'}</p>
                <div className="mt-auto pt-4 border-t border-slate-700/50 flex justify-between items-center text-sm">
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
        )
      )}

      {/* Group Edit/Create Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">{editingGroup ? 'Edit Group' : 'Create Group'}</h2>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Group Name *</label>
                  <input
                    type="text"
                    required
                    value={groupData.name}
                    onChange={(e) => setGroupData({...groupData, name: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={groupData.description}
                    onChange={(e) => setGroupData({...groupData, description: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Contacts ({groupData.contacts.length} selected)</label>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 max-h-60 overflow-y-auto">
                    {contacts.length === 0 ? (
                      <p className="p-4 text-center text-slate-400">No contacts available.</p>
                    ) : (
                      contacts.map(contact => (
                        <label key={contact._id} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={groupData.contacts.includes(contact._id)}
                            onChange={() => toggleGroupContact(contact._id)}
                            className="rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-600"
                          />
                          <div>
                            <p className="text-sm text-white font-medium">
                              {truncateText(contact.firstName ? `${contact.firstName} ${contact.lastName || ''}` : contact.email, 30)}
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
                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white">
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
