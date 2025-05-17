export type Survey = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
  expiry_date?: string;
};

export type Question = {
  id: string;
  survey_id: string;
  text: string;
  type: 'checkbox' | 'text' | 'radio';
  section: string;
  order: number;
  is_required: boolean;
};

export type Option = {
  id: string;
  question_id: string;
  text: string;
  order: number;
};

export type Response = {
  id: string;
  survey_id: string;
  question_id: string;
  option_id?: string;
  text_response?: string;
  respondent_id?: string;
  created_at: string;
};

export type Respondent = {
  id: string;
  email?: string;
  created_at: string;
};
