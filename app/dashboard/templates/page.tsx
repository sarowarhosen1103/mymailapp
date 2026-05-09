"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, Layout, Mail, MoreVertical, Edit2, Trash2, X } from 'lucide-react';

interface Template {
  _id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  status: string;
  attachmentPath?: string;
  attachmentName?: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'Marketing',
    status: 'Draft',
    attachment: null as File | null
  });

  const categories = ['Onboarding', 'Marketing', 'Transactional', 'E-commerce'];

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dynamicVariables = ['{{name}}', '{{company}}', '{{email}}', '{{date}}'];

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData(prev => ({ ...prev, content: prev.content + variable }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;

    const newContent = 
      currentContent.substring(0, start) + 
      variable + 
      currentContent.substring(end);

    setFormData({ ...formData, content: newContent });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category,
        status: template.status,
        attachment: null
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        content: '',
        category: 'Marketing',
        status: 'Draft',
        attachment: null
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate 
        ? `/api/templates/${editingTemplate._id}` 
        : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const data = new FormData();
      data.append('name', formData.name);
      data.append('subject', formData.subject);
      data.append('content', formData.content);
      data.append('category', formData.category);
      data.append('status', formData.status);
      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      const res = await fetch(url, {
        method,
        body: data
      });

      if (res.ok) {
        await fetchTemplates();
        handleCloseModal();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTemplates(templates.filter(t => t._id !== id));
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
          Email Templates
        </h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-5 w-5" />
          Create Template
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700">
          <Layout className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No templates found</h3>
          <p className="text-slate-400 mb-6">Get started by creating your first email template.</p>
          <button 
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-5 py-2.5 rounded-xl font-medium transition-colors border border-indigo-500/20"
          >
            <Plus className="h-5 w-5" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div 
              key={template._id}
              className="group relative flex flex-col rounded-2xl bg-slate-800/50 border border-slate-700 shadow-lg overflow-hidden backdrop-blur-sm transition-all hover:bg-slate-800 hover:border-slate-600 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="h-40 bg-slate-900 border-b border-slate-700 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                <Layout className="h-12 w-12 text-slate-700 group-hover:text-indigo-400/50 transition-colors" />
                
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    template.status === 'Active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {template.status}
                  </span>
                  {template.attachmentPath && (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <Layout className="h-3 w-3" /> PDF
                    </span>
                  )}
                </div>


              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors truncate pr-4">
                    {template.name}
                  </h3>
                </div>
                
                <div className="text-sm text-slate-400 mb-3 line-clamp-1">
                  Subject: {template.subject}
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                    <Mail className="h-3 w-3 mr-1" />
                    {template.category}
                  </span>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-400 border-t border-slate-700/50">
                  <span>Updated {timeAgo(template.updatedAt)}</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleOpenModal(template)}
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(template._id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="e.g. Welcome Email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="e.g. Welcome to our platform!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="text-indigo-500 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                      />
                      <span className="text-slate-300">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="Draft"
                        checked={formData.status === 'Draft'}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="text-indigo-500 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                      />
                      <span className="text-slate-300">Draft</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between">
                    <span>Email Content</span>
                    <span className="text-xs text-slate-500">HTML supported</span>
                  </label>
                  
                  {/* Dynamic Variables Toolbar */}
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-800/50 border border-slate-700 rounded-lg items-center">
                    <span className="text-xs text-slate-400 mr-1">Insert variable:</span>
                    {dynamicVariables.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="px-2 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded border border-indigo-500/20 transition-colors"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={8}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                    placeholder="<p>Hello {{name}},</p>"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Attachment (Optional PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormData({...formData, attachment: e.target.files?.[0] || null})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                  />
                  {editingTemplate?.attachmentName && !formData.attachment && (
                    <p className="text-xs text-slate-500 mt-1">Current file: {editingTemplate.attachmentName}</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
