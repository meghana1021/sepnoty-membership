import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import FormList from './components/FormList';
import FormBuilder from './components/FormBuilder';
import FormViewer from './components/FormViewer';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { Form } from './types/form';
import { useApi } from './hooks/useApi';
import { apiService } from './services/api';

type ViewType = 'forms' | 'dashboard' | 'create-form' | 'edit-form' | 'view-form' | 'fill-form';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('forms');
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  const { 
    data: forms, 
    loading: formsLoading, 
    error: formsError, 
    refetch: refetchForms 
  } = useApi(() => apiService.getForms(), []);

  // Handle URL parameters for direct form access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('form');
    const mode = urlParams.get('mode');

    if (formId && forms) {
      const form = forms.find(f => f.id === formId);
      if (form) {
        setSelectedForm(form);
        if (mode === 'fill') {
          setCurrentView('fill-form');
        } else {
          setCurrentView('view-form');
        }
      }
    }
  }, [forms]);

  const handleViewChange = (view: 'forms' | 'dashboard' | 'create-form') => {
    setCurrentView(view);
    setSelectedForm(null);
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleFormSave = () => {
    refetchForms();
    setCurrentView('forms');
    setSelectedForm(null);
  };

  const handleEditForm = (form: Form) => {
    setSelectedForm(form);
    setCurrentView('edit-form');
  };

  const handleViewForm = (form: Form) => {
    setSelectedForm(form);
    setCurrentView('view-form');
  };

  const handleFillForm = (form: Form) => {
    setSelectedForm(form);
    setCurrentView('fill-form');
  };

  const handleDeleteForm = () => {
    refetchForms();
  };

  const handleBack = () => {
    setCurrentView('forms');
    setSelectedForm(null);
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const renderCurrentView = () => {
    if (formsLoading && currentView === 'forms') {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading forms..." />
        </div>
      );
    }

    if (formsError && currentView === 'forms') {
      return (
        <div className="max-w-2xl mx-auto p-6">
          <ErrorMessage 
            message={formsError} 
            onRetry={refetchForms}
          />
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewForm={handleViewForm} />;
        
      case 'create-form':
        return (
          <FormBuilder
            onSave={handleFormSave}
            onCancel={handleBack}
          />
        );
        
      case 'edit-form':
        return selectedForm ? (
          <FormBuilder
            form={selectedForm}
            onSave={handleFormSave}
            onCancel={handleBack}
          />
        ) : null;
        
      case 'view-form':
        return selectedForm ? (
          <FormViewer
            form={selectedForm}
            onBack={handleBack}
            mode="preview"
          />
        ) : null;
        
      case 'fill-form':
        return selectedForm ? (
          <FormViewer
            form={selectedForm}
            onBack={handleBack}
            mode="fill"
          />
        ) : null;
        
      case 'forms':
      default:
        return (
          <FormList
            forms={forms || []}
            onEditForm={handleEditForm}
            onViewForm={handleViewForm}
            onDeleteForm={handleDeleteForm}
            onRefresh={refetchForms}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentView={currentView === 'edit-form' ? 'create-form' : currentView as any}
        onViewChange={handleViewChange}
      />
      
      <main className="py-6">
        {renderCurrentView()}
      </main>

      {/* Demo Data Button - Only show when no forms and not loading */}
      {!formsLoading && !formsError && forms?.length === 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={async () => {
              try {
                const sampleForm = {
                  title: 'Sepnoty Club Membership Application',
                  description: 'Join our exclusive club and become part of our community!',
                  fields: [
                    {
                      id: 'name',
                      type: 'text' as const,
                      label: 'Full Name',
                      required: true,
                      placeholder: 'Enter your full name'
                    },
                    {
                      id: 'email',
                      type: 'email' as const,
                      label: 'Email Address',
                      required: true,
                      placeholder: 'your@email.com'
                    },
                    {
                      id: 'experience',
                      type: 'select' as const,
                      label: 'Programming Experience',
                      required: true,
                      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
                    },
                    {
                      id: 'interests',
                      type: 'checkbox' as const,
                      label: 'Areas of Interest',
                      required: false,
                      options: ['Web Development', 'Mobile Apps', 'AI/ML', 'Data Science', 'Game Development']
                    },
                    {
                      id: 'motivation',
                      type: 'textarea' as const,
                      label: 'Why do you want to join Sepnoty Club?',
                      required: true,
                      placeholder: 'Tell us about your motivation...'
                    }
                  ]
                };
                
                await apiService.createForm(sampleForm);
                refetchForms();
              } catch (error) {
                console.error('Failed to create sample form:', error);
                alert('Failed to create sample form. Please check if the server is running.');
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all text-sm"
          >
            Add Sample Form
          </button>
        </div>
      )}
    </div>
  );
}

export default App;