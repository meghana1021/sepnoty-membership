import React from 'react';
import { Edit, Eye, Trash2, Download, Calendar, Users, ExternalLink } from 'lucide-react';
import { Form } from '../types/form';
import { useAsyncAction } from '../hooks/useApi';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface FormListProps {
  forms: Form[];
  onEditForm: (form: Form) => void;
  onViewForm: (form: Form) => void;
  onDeleteForm: (formId: string) => void;
  onRefresh: () => void;
}

const FormList: React.FC<FormListProps> = ({ 
  forms, 
  onEditForm, 
  onViewForm, 
  onDeleteForm,
  onRefresh 
}) => {
  const { execute: deleteForm, loading: deleting } = useAsyncAction(
    async (formId: string) => {
      await apiService.deleteForm(formId);
    }
  );

  const { execute: exportResponses } = useAsyncAction(
    async (formId: string, formTitle: string) => {
      const blob = await apiService.exportFormResponses(formId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formTitle}_responses.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  );

  const handleDownload = async (form: Form) => {
    try {
      await exportResponses(form.id, form.title);
    } catch (error) {
      alert('Failed to export responses. Please try again.');
    }
  };

  const handleDelete = async (form: Form) => {
    if (window.confirm(`Are you sure you want to delete "${form.title}"? This action cannot be undone.`)) {
      try {
        await deleteForm(form.id);
        onDeleteForm(form.id);
        onRefresh();
      } catch (error) {
        alert('Failed to delete form. Please try again.');
      }
    }
  };

  if (forms.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No forms yet</h3>
          <p className="text-gray-600 mb-6">Create your first form to start collecting responses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Forms</h2>
        <p className="text-gray-600">Manage and view your forms and responses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <div key={form.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white truncate" title={form.title}>
                {form.title}
              </h3>
              <p className="text-purple-100 text-sm mt-1">
                {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-6">
              {form.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {form.description}
                </p>
              )}

              <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>0 responses</span>
                </div>
              </div>

              <div className="space-y-2">
                {/* Primary Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewForm(form)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Preview</span>
                  </button>
                  
                  <button
                    onClick={() => onEditForm(form)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                </div>

                {/* Fill Form Button */}
                <button
                  onClick={() => {
                    // Open form in fill mode - this is the main action users will use
                    const currentUrl = window.location.origin;
                    const fillUrl = `${currentUrl}?form=${form.id}&mode=fill`;
                    window.open(fillUrl, '_blank');
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Fill Form</span>
                </button>

                {/* Secondary Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(form)}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    title="Download responses"
                  >
                    <Download className="w-4 h-4 mx-auto" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(form)}
                    disabled={deleting}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Delete form"
                  >
                    {deleting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="w-4 h-4 mx-auto" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormList;