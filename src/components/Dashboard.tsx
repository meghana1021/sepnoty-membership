import React, { useState, useMemo } from 'react';
import { BarChart3, Users, FileText, Calendar, Download, Search, Filter, Eye } from 'lucide-react';
import { Form } from '../types/form';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface DashboardProps {
  onViewForm: (form: Form) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewForm }) => {
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'email'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useApi(() => apiService.getDashboardStats(), []);

  const { 
    data: allResponses, 
    loading: responsesLoading, 
    error: responsesError, 
    refetch: refetchResponses 
  } = useApi(() => apiService.getAllResponses(), []);

  const { 
    data: forms, 
    loading: formsLoading, 
    error: formsError 
  } = useApi(() => apiService.getForms(), []);

  const { execute: exportAllData } = useAsyncAction(
    async () => {
      if (!allResponses || allResponses.length === 0) {
        throw new Error('No responses to export');
      }

      const headers = ['Form Title', 'Submitted At', 'Submitter Name', 'Submitter Email', 'Response Data'];
      const rows = allResponses.map(response => [
        response.formTitle,
        new Date(response.submittedAt).toLocaleString(),
        response.submitterName || '',
        response.submitterEmail || '',
        JSON.stringify(response.answers)
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sepnoty_club_all_responses.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  );

  const filteredResponses = useMemo(() => {
    if (!allResponses) return [];

    let responses = [...allResponses];

    // Filter by form
    if (selectedForm !== 'all') {
      responses = responses.filter(r => r.formId === selectedForm);
    }

    // Filter by search term
    if (searchTerm) {
      responses = responses.filter(r => 
        r.submitterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.submitterEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.formTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort responses
    responses.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.submitterName || '';
          bValue = b.submitterName || '';
          break;
        case 'email':
          aValue = a.submitterEmail || '';
          bValue = b.submitterEmail || '';
          break;
        case 'date':
        default:
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return responses;
  }, [allResponses, selectedForm, searchTerm, sortBy, sortOrder]);

  const handleExportAll = async () => {
    try {
      await exportAllData();
    } catch (error: any) {
      alert(error.message || 'Failed to export data');
    }
  };

  if (statsLoading || responsesLoading || formsLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  if (statsError || responsesError || formsError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorMessage 
          message={statsError || responsesError || formsError || 'Failed to load dashboard'} 
          onRetry={() => {
            refetchStats();
            refetchResponses();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of your forms and responses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Forms</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalForms || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Responses</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalResponses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg per Form</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.avgResponsesPerForm || '0'}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Performance */}
      {forms && forms.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Performance</h3>
          <div className="space-y-4">
            {forms.map(form => {
              const responseCount = allResponses?.filter(r => r.formId === form.id).length || 0;
              const maxResponses = Math.max(...forms.map(f => 
                allResponses?.filter(r => r.formId === f.id).length || 0
              ), 1);
              const percentage = (responseCount / maxResponses) * 100;

              return (
                <div key={form.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{form.title}</h4>
                      <span className="text-sm text-gray-600">{responseCount} responses</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => onViewForm(form)}
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View form"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Responses Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">All Responses</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search responses..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>

              {/* Form Filter */}
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="all">All Forms</option>
                {forms?.map(form => (
                  <option key={form.id} value={form.id}>{form.title}</option>
                ))}
              </select>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy as any);
                    setSortOrder(newSortOrder as any);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                </select>
              </div>

              {/* Export */}
              <button
                onClick={handleExportAll}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredResponses.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No responses found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResponses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{response.formTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{response.submitterName || 'Anonymous'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{response.submitterEmail || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(response.submittedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(response.submittedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        <div className="space-y-1">
                          {Object.entries(response.answers).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="truncate">
                              <span className="font-medium text-xs text-gray-500">{key}:</span>{' '}
                              <span className="text-gray-900">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                          {Object.keys(response.answers).length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{Object.keys(response.answers).length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;