import React, { useState } from 'react';
import { ArrowLeft, Send, Calendar, User, ExternalLink } from 'lucide-react';
import { Form } from '../types/form';
import { useAsyncAction } from '../hooks/useApi';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface FormViewerProps {
  form: Form;
  onBack: () => void;
  mode: 'preview' | 'fill';
}

const FormViewer: React.FC<FormViewerProps> = ({ form, onBack, mode }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { execute: submitResponse, loading: submitting, error: submitError } = useAsyncAction(
    async (data: { answers: Record<string, any>; submitterName?: string; submitterEmail?: string }) => {
      return await apiService.submitResponse(form.id, data);
    }
  );

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'preview') return;

    // Validate required fields
    const missingFields = form.fields
      .filter(field => field.required && (!formData[field.id] || formData[field.id] === ''))
      .map(field => field.label);

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      await submitResponse({
        answers: formData,
        submitterName: submitterName.trim() || undefined,
        submitterEmail: submitterEmail.trim() || undefined
      });
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled by useAsyncAction
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
            disabled={mode === 'preview' || submitting}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none bg-white"
            disabled={mode === 'preview' || submitting}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
            disabled={mode === 'preview' || submitting}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  disabled={mode === 'preview' || submitting}
                  required={field.required}
                />
                <span className="text-gray-700 select-none">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {field.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v: string) => v !== option);
                    handleFieldChange(field.id, newValue);
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  disabled={mode === 'preview' || submitting}
                />
                <span className="text-gray-700 select-none">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg text-center p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600 mb-6">Your response has been submitted successfully to Sepnoty Club.</p>
          <div className="space-y-3">
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
            >
              Back to Forms
            </button>
            <p className="text-sm text-gray-500">
              We'll review your application and get back to you soon!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Forms</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6">
          <h1 className="text-2xl font-bold text-white">{form.title}</h1>
          {form.description && (
            <p className="text-purple-100 mt-2">{form.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-4 text-sm text-purple-100">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && (
            <ErrorMessage message={submitError} />
          )}

          {mode === 'fill' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                  placeholder="Enter your name"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email (Optional)
                </label>
                <input
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                  placeholder="Enter your email"
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {form.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

          {mode === 'fill' && (
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                By submitting, you agree to join the Sepnoty Club community
              </p>
            </div>
          )}

          {mode === 'preview' && (
            <div className="pt-6 border-t border-gray-200 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm font-medium">
                  This is a preview of your form. Users will be able to fill it out and submit responses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.open(`/forms/${form.id}/fill`, '_blank')}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Form for Users</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FormViewer;