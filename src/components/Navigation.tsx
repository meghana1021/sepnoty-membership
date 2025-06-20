import React from 'react';
import { FileText, BarChart3, Plus } from 'lucide-react';
import SepnotyLogo from '../assets/sepnoty-logo.png'; // ✅ Adjust path as needed

interface NavigationProps {
  currentView: 'forms' | 'dashboard' | 'create-form';
  onViewChange: (view: 'forms' | 'dashboard' | 'create-form') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'forms', label: 'My Forms', icon: FileText },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'create-form', label: 'Create Form', icon: Plus }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {/* ✅ Updated: Sepnoty Logo replaces icon box */}
              <img
                src={SepnotyLogo}
                alt="Sepnoty Logo"
                className="w-8 h-8 object-contain rounded"
              />
              <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Sepnotians club
              </h1>
            </div>
          </div>

          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as any)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
