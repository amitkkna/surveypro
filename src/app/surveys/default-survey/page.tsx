'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { defaultSurvey } from '@/data/defaultSurvey';
import CheckboxQuestion from '@/components/CheckboxQuestion';

export default function DefaultSurveyForm() {
  const [currentSection, setCurrentSection] = useState(defaultSurvey.questions[0].section);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Get unique sections
  const sections = [...new Set(defaultSurvey.questions.map(q => q.section))];

  // Create default values with empty arrays for checkbox questions
  const defaultValues: {[key: string]: any} = {};
  defaultSurvey.questions.forEach((question, index) => {
    // Use the global index for each question
    if (question.type === 'checkbox') {
      defaultValues[`question_${index}`] = [];
    }
  });

  // Use form with default values and preserve state between renders
  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm({
    defaultValues,
    shouldUnregister: false // Keep form values when fields are unmounted
  });

  const onSubmit = async (data: any) => {
    setSubmitting(true);

    try {
      // Log the form data
      console.log('Form data:', data);
      console.log('Email:', email);

      // Import the necessary functions and initialize Supabase
      const { createClient } = await import('@supabase/supabase-js');

      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfcbxnqvbfzwjnxmtlnl.supabase.co';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmY2J4bnF2YmZ6d2pueG10bG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0NzcsImV4cCI6MjAzMzAwNjQ3N30.Nh83ebqzv9BUCCPJeXfH6XmjL8m2LGQSrQNwuTJj7lY';

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Create a mock survey in Supabase if it doesn't exist
      const { data: existingSurveys, error: surveysError } = await supabase
        .from('surveys')
        .select('id')
        .eq('title', defaultSurvey.title)
        .limit(1);

      if (surveysError) {
        console.error('Error fetching surveys:', surveysError);
        throw new Error('Failed to fetch surveys');
      }

      let surveyId;

      if (!existingSurveys || existingSurveys.length === 0) {
        // Create the survey
        const { data: newSurvey, error: surveyError } = await supabase
          .from('surveys')
          .insert({
            title: defaultSurvey.title,
            description: defaultSurvey.description,
            created_by: 'system',
            is_active: true
          })
          .select()
          .single();

        if (surveyError) {
          console.error('Error creating survey:', surveyError);
          throw new Error('Failed to create survey');
        }

        surveyId = newSurvey.id;

        // Create questions and options
        for (let i = 0; i < defaultSurvey.questions.length; i++) {
          const q = defaultSurvey.questions[i];

          // Create question
          const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert({
              survey_id: surveyId,
              text: q.text,
              type: q.type,
              section: q.section,
              order: i,
              is_required: q.is_required
            })
            .select()
            .single();

          if (questionError) {
            console.error('Error creating question:', questionError);
            continue;
          }

          // Create options for checkbox and radio questions
          if (q.type !== 'text' && q.options) {
            for (let j = 0; j < q.options.length; j++) {
              const { error: optionError } = await supabase
                .from('options')
                .insert({
                  question_id: question.id,
                  text: q.options[j].text,
                  order: j
                });

              if (optionError) {
                console.error('Error creating option:', optionError);
              }
            }
          }
        }
      } else {
        surveyId = existingSurveys[0].id;
      }

      // Create respondent if email is provided
      let respondentId = null;
      if (email) {
        try {
          const { data: respondent, error: respondentError } = await supabase
            .from('respondents')
            .insert({ email })
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

      // Get all questions for this survey
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, text, type')
        .eq('survey_id', surveyId);

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw new Error('Failed to fetch questions');
      }

      if (!questions || questions.length === 0) {
        throw new Error('No questions found for this survey');
      }

      // Process and submit responses
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('question_')) {
          const questionIndex = parseInt(key.split('_')[1]);
          // Get the question using the global index
          const question = defaultSurvey.questions[questionIndex];
          if (!question) {
            console.error(`Question with index ${questionIndex} not found`);
            continue;
          }

          const dbQuestion = questions.find(q => q.text === question.text);
          if (!dbQuestion) continue;

          if (question.type === 'text') {
            // Text response
            if (value && typeof value === 'string') {
              const { error: responseError } = await supabase
                .from('responses')
                .insert({
                  survey_id: surveyId,
                  question_id: dbQuestion.id,
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
              const { data: options, error: optionsError } = await supabase
                .from('options')
                .select('id')
                .eq('question_id', dbQuestion.id)
                .eq('text', optionText)
                .limit(1);

              if (optionsError) {
                console.error('Error finding option:', optionsError);
                continue;
              }

              if (options && options.length > 0) {
                const { error: responseError } = await supabase
                  .from('responses')
                  .insert({
                    survey_id: surveyId,
                    question_id: dbQuestion.id,
                    option_id: options[0].id,
                    respondent_id: respondentId
                  });

                if (responseError) {
                  console.error('Error saving checkbox response:', responseError);
                }
              }
            }
          } else if (typeof value === 'string') {
            // Radio button
            const { data: options, error: optionsError } = await supabase
              .from('options')
              .select('id')
              .eq('question_id', dbQuestion.id)
              .eq('text', value)
              .limit(1);

            if (optionsError) {
              console.error('Error finding option:', optionsError);
              continue;
            }

            if (options && options.length > 0) {
              const { error: responseError } = await supabase
                .from('responses')
                .insert({
                  survey_id: surveyId,
                  question_id: dbQuestion.id,
                  option_id: options[0].id,
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
      alert('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestions = defaultSurvey.questions.filter(q => q.section === currentSection);
  const currentSectionIndex = sections.indexOf(currentSection);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow sm:rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your response has been successfully submitted.</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900">{defaultSurvey.title}</h2>
          <p className="mt-1 text-gray-600">{defaultSurvey.description}</p>

          <div className="mt-6">
            <nav className="flex items-center justify-between bg-gray-50 p-4 rounded-md mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{currentSection}</h3>
                <p className="text-sm text-gray-500">
                  Section {currentSectionIndex + 1} of {sections.length}
                </p>
              </div>
              <div className="flex space-x-2">
                {currentSectionIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Log form values before changing section
                      console.log("Form values before changing to previous section:", getValues());
                      setCurrentSection(sections[currentSectionIndex - 1]);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Previous
                  </button>
                )}
                {currentSectionIndex < sections.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Log form values before changing section
                      console.log("Form values before changing to next section:", getValues());
                      setCurrentSection(sections[currentSectionIndex + 1]);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Next
                  </button>
                )}
              </div>
            </nav>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                {currentQuestions.map((question, index) => {
                  // Find the global index of this question in the entire survey
                  const globalIndex = defaultSurvey.questions.findIndex(q => q.text === question.text);
                  const fieldName = `question_${globalIndex}`;

                  return (
                    <div key={globalIndex} className="border border-gray-200 rounded-md p-4">
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
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center">
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
                            question={question}
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

                {currentSectionIndex === sections.length - 1 && (
                  <div className="border border-gray-200 rounded-md p-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter your email to receive updates"
                    />
                  </div>
                )}

                {currentSectionIndex === sections.length - 1 && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {submitting ? 'Submitting...' : 'Submit Survey'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
