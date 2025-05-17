import { supabase } from './supabase';
import { Survey, Question, Option, Response, Respondent } from '../types/database.types';

// Survey APIs
export const createSurvey = async (survey: Omit<Survey, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('surveys')
    .insert(survey)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getSurvey = async (id: string) => {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const getSurveys = async () => {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Question APIs
export const createQuestion = async (question: Omit<Question, 'id'>) => {
  const { data, error } = await supabase
    .from('questions')
    .insert(question)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getQuestions = async (surveyId: string) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('order', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Option APIs
export const createOption = async (option: Omit<Option, 'id'>) => {
  const { data, error } = await supabase
    .from('options')
    .insert(option)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getOptions = async (questionId: string) => {
  const { data, error } = await supabase
    .from('options')
    .select('*')
    .eq('question_id', questionId)
    .order('order', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Response APIs
export const createResponse = async (response: Omit<Response, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('responses')
    .insert(response)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getResponses = async (surveyId: string) => {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('survey_id', surveyId);
  
  if (error) throw error;
  return data;
};

// Respondent APIs
export const createRespondent = async (respondent: Omit<Respondent, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('respondents')
    .insert(respondent)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Get full survey with questions and options
export const getFullSurvey = async (surveyId: string) => {
  // Get survey
  const survey = await getSurvey(surveyId);
  
  // Get questions
  const questions = await getQuestions(surveyId);
  
  // Get options for each question
  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
      const options = await getOptions(question.id);
      return { ...question, options };
    })
  );
  
  return { ...survey, questions: questionsWithOptions };
};
