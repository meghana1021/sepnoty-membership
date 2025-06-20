import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { Form, FormField } from '../types/form';
import { useAsyncAction } from '../hooks/useApi';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface FormBuilderProps {
  form?: Form;
  onSave: (form: Form) => void;
  onCancel: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ form, onSave, onCancel }) => {
  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState<FormField[]>(form?.fields || []);

  const { execute: saveForm, loading: saving, error: saveError } = useAsyncAction(
    async (formData: Omit<Form, 'id' | 'createdAt' | 'responses'>) => {
      if (form) {
        return await apiService.updateForm(form.id, formData);
      } else {
        return await apiService.createForm(formData);
      }
    }
  );

  const fieldTypes = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkboxes' }
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
      placeholder: ''
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = fields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    );
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a form title');
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    try {
      const formData = {
        title: title.trim(),
        description: description.trim(),
        fields
      };

      const savedForm = await saveForm(formData);
      onSave(savedForm);
    } catch (error) {
      // Error is handled by useAsyncAction
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            {form ? 'Edit Form' : 'Create New Form'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {saveError && (
            <ErrorMessage message={saveError} />
          )}

          {/* Form Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter form title"
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter form description"
                disabled={saving}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
              <button
                onClick={addField}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-start space-x-4">
                    <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-move" />
                    
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            disabled={saving}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as FormField['type'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            disabled={saving}
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Placeholder Text
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          disabled={saving}
                        />
                      </div>

                      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Options (one per line)
                          </label>
                          <textarea
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => updateField(index, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            disabled={saving}
                          />
                        </div>
                      )}

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`required-${field.id}`}
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          disabled={saving}
                        />
                        <label htmlFor={`required-${field.id}`} className="ml-2 text-sm text-gray-700">
                          Required field
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={() => removeField(index)}
                      disabled={saving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Form'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;