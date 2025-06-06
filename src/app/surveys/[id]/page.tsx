'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClient } from '@supabase/supabase-js';
import CheckboxQuestion from '@/components/CheckboxQuestion';

interface Question {
  id: string;
  survey_id: string;
  text: string;
  type: 'text' | 'radio' | 'checkbox';
  section: string;
  order: number;
  is_required: boolean;
  options?: Option[];
}

interface Option {
  id: string;
  question_id: string;
  text: string;
  order: number;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
  expiry_date?: string;
}

export default function SurveyForm() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSection, setCurrentSection] = useState<string>('');
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    shouldUnregister: false // Keep form values when fields are unmounted
  });

  // Initialize checkbox fields with empty arrays
  useEffect(() => {
    questions.forEach((question, index) => {
      if (question.type === 'checkbox') {
        // Initialize all checkbox questions with empty arrays
        setValue(`question_${index}`, [], { shouldValidate: false });
      }
    });
  }, [questions, setValue]);

  useEffect(() => {
    async function fetchSurvey() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kqghxodcktofosdtmbrc.supabase.co';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZ2h4b2Rja3RvZm9zZHRtYnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzMzMjEsImV4cCI6MjA2MjgwOTMyMX0.OJ5Z5nuRzvHyj6r_L89uCq7r-Mb7j7MkR8KSG04r7iA';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch survey details
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyId)
          .single();

        if (surveyError) {
          throw surveyError;
        }

        setSurvey(surveyData);

        // Fetch questions with options
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select(`
            *,
            options (*)
          `)
          .eq('survey_id', surveyId)
          .order('order', { ascending: true });

        if (questionsError) {
          throw questionsError;
        }

        // Sort options by order
        const questionsWithSortedOptions = questionsData.map((q: any) => ({
          ...q,
          options: q.options ? [...q.options].sort((a: Option, b: Option) => a.order - b.order) : []
        }));

        setQuestions(questionsWithSortedOptions);

        // Get unique sections
        const uniqueSections = [...new Set(questionsWithSortedOptions.map((q: Question) => q.section))];
        setSections(uniqueSections);

        if (uniqueSections.length > 0) {
          setCurrentSection(uniqueSections[0]);
        }
      } catch (error: any) {
        console.error('Error fetching survey:', error);
        setError(error.message || 'Failed to fetch survey');
      } finally {
        setLoading(false);
      }
    }

    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);

    try {
      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kqghxodcktofosdtmbrc.supabase.co';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZ2h4b2Rja3RvZm9zZHRtYnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzMzMjEsImV4cCI6MjA2MjgwOTMyMX0.OJ5Z5nuRzvHyj6r_L89uCq7r-Mb7j7MkR8KSG04r7iA';
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Create respondent if email or contact is provided
      let respondentId = null;
      if (email || contact) {
        try {
          const { data: respondent, error: respondentError } = await supabase
            .from('respondents')
            .insert({
              email: email || null,
              phone: contact || null
            })
            .select()
            .single();

          if (respondentError) {
            console.error('Error creating respondent:', respondentError);
          } else {
            respondentId = respondent.id;
          }
        } catch (error) {
          console.error('Error creating respondent:', error);
        }
      }

      // Process and submit responses
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('question_')) {
          const questionIndex = parseInt(key.split('_')[1]);
          const question = questions[questionIndex];

          if (!question) {
            console.error(`Question with index ${questionIndex} not found`);
            continue;
          }

          if (question.type === 'text') {
            // Text response
            if (value && typeof value === 'string') {
              const { error: responseError } = await supabase
                .from('responses')
                .insert({
                  survey_id: surveyId,
                  question_id: question.id,
                  text_response: value,
                  respondent_id: respondentId
                });

              if (responseError) {
                console.error('Error saving text response:', responseError);
              }
            }
          } else if (Array.isArray(value)) {
            // Checkbox (multiple selections)
            for (const optionText of value) {
              // Find the option ID
              const option = question.options?.find(opt => opt.text === optionText);

              if (option) {
                const { error: responseError } = await supabase
                  .from('responses')
                  .insert({
                    survey_id: surveyId,
                    question_id: question.id,
                    option_id: option.id,
                    respondent_id: respondentId
                  });

                if (responseError) {
                  console.error('Error saving checkbox response:', responseError);
                }
              }
            }
          } else if (typeof value === 'string') {
            // Radio button
            const option = question.options?.find(opt => opt.text === value);

            if (option) {
              const { error: responseError } = await supabase
                .from('responses')
                .insert({
                  survey_id: surveyId,
                  question_id: question.id,
                  option_id: option.id,
                  respondent_id: respondentId
                });

              if (responseError) {
                console.error('Error saving radio response:', responseError);
              }
            }
          }
        }
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <p className="text-center">Loading survey...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
            <p>{error || 'Survey not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h2>
            <p className="mb-6">Your response has been submitted successfully.</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestions = questions.filter(q => q.section === currentSection);
  const currentSectionIndex = sections.indexOf(currentSection);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{survey.description}</p>
          </div>

          {sections.length > 1 && (
            <div className="mb-6">
              <nav className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {sections.map((section, index) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setCurrentSection(section)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        currentSection === section
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Section {currentSectionIndex + 1} of {sections.length}
                </p>
              </nav>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {currentQuestions.map((question) => {
              // Find the global index of this question in the entire survey
              const globalIndex = questions.findIndex(q => q.id === question.id);
              const fieldName = `question_${globalIndex}`;

              return (
                <div key={question.id} className="border border-gray-200 rounded-md p-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {question.text}
                    {question.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  <div className="mt-2">
                    {question.type === 'text' ? (
                      <div>
                        <input
                          type="text"
                          {...register(fieldName, {
                            required: question.is_required ? 'This field is required' : false,
                          })}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors[fieldName] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[fieldName]?.message as string}
                          </p>
                        )}
                      </div>
                    ) : question.type === 'radio' ? (
                      <div className="mt-2 space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <div key={option.id} className="flex items-center">
                            <input
                              id={`question_${globalIndex}_option_${optionIndex}`}
                              type="radio"
                              value={option.text}
                              {...register(fieldName, {
                                required: question.is_required ? 'Please select an option' : false,
                              })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <label
                              htmlFor={`question_${globalIndex}_option_${optionIndex}`}
                              className="ml-3 block text-sm text-gray-700"
                            >
                              {option.text}
                            </label>
                          </div>
                        ))}
                        {errors[fieldName] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[fieldName]?.message as string}
                          </p>
                        )}
                      </div>
                    ) : (
                      <CheckboxQuestion
                        question={{
                          text: question.text,
                          options: question.options || [],
                          is_required: question.is_required
                        }}
                        index={globalIndex}
                        register={register}
                        setValue={setValue}
                        watch={watch}
                        errors={errors}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between mt-6 mb-4">
              {currentSectionIndex > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection(sections[currentSectionIndex - 1]);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Previous
                </button>
              )}
              {currentSectionIndex < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection(sections[currentSectionIndex + 1]);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                </button>
              ) : (
                <div>{/* Empty div for flex spacing when there's no Next button */}</div>
              )}
            </div>

            {/* Always show email field and submit button at the end */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="your.email@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Provide your email if you'd like to receive a copy of your responses.
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                  Contact Number (Optional)
                </label>
                <input
                  type="tel"
                  id="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Your phone number"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Provide your contact number if you'd like to be contacted about your responses.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
