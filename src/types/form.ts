export interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  createdAt: string;
  responses: FormResponse[];
}

export interface FormResponse {
  id: string;
  formId: string;
  answers: Record<string, any>;
  submittedAt: string;
  submitterName?: string;
  submitterEmail?: string;
}

export interface DashboardStats {
  totalForms: number;
  totalResponses: number;
  avgResponsesPerForm: number;
  recentResponses: FormResponse[];
}