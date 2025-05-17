'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { createSurvey, createQuestion, createOption } from '@/utils/api';

type FormData = {
  title: string;
  description: string;
  questions: {
    text: string;
    type: 'checkbox' | 'text' | 'radio';
    section: string;
    is_required: boolean;
    options: {
      text: string;
    }[];
  }[];
};

export default function CreateSurvey() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      questions: [
        {
          text: '',
          type: 'checkbox',
          section: 'SECTION 1',
          is_required: false,
          options: [{ text: '' }],
        },
      ],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Create survey
      const survey = await createSurvey({
        title: data.title,
        description: data.description,
        created_by: 'admin', // This will be replaced with the actual user ID
        is_active: true,
      });

      console.log('Survey created:', survey);

      // Create questions and options
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];

        // Create question
        const question = await createQuestion({
          survey_id: survey.id,
          text: q.text,
          type: q.type,
          section: q.section,
          order: i,
          is_required: q.is_required,
        });

        console.log(`Question ${i+1} created:`, question);

        // Create options for checkbox and radio questions
        if (q.type !== 'text' && q.options) {
          for (let j = 0; j < q.options.length; j++) {
            const option = await createOption({
              question_id: question.id,
              text: q.options[j].text,
              order: j,
            });

            console.log(`Option ${j+1} for question ${i+1} created:`, option);
          }
        }
      }

      alert('Survey created successfully!');
      router.push('/admin');
    } catch (error) {
      console.error('Error creating survey:', error);
      alert('Failed to create survey. Please check the console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Survey</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Survey Title
              </label>
              <input
                type="text"
                id="title"
                {...register('title', { required: 'Title is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description', { required: 'Description is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900">Questions</h4>
              <div className="space-y-4 mt-3">
                {questionFields.map((field, questionIndex) => {
                  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
                    control,
                    name: `questions.${questionIndex}.options`,
                  });

                  const questionType = watch(`questions.${questionIndex}.type`);

                  return (
                    <div key={field.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <h5 className="text-sm font-medium text-gray-700">Question {questionIndex + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-3 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Section
                          </label>
                          <input
                            type="text"
                            {...register(`questions.${questionIndex}.section`, { required: 'Section is required' })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Question Text
                          </label>
                          <input
                            type="text"
                            {...register(`questions.${questionIndex}.text`, { required: 'Question text is required' })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Question Type
                          </label>
                          <select
                            {...register(`questions.${questionIndex}.type`)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="checkbox">Checkbox (Multiple Choice)</option>
                            <option value="radio">Radio (Single Choice)</option>
                            <option value="text">Text Input</option>
                          </select>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`required-${questionIndex}`}
                            {...register(`questions.${questionIndex}.is_required`)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`required-${questionIndex}`} className="ml-2 block text-sm text-gray-700">
                            Required
                          </label>
                        </div>

                        {(questionType === 'checkbox' || questionType === 'radio') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Options
                            </label>
                            <div className="space-y-2 mt-2">
                              {optionFields.map((optionField, optionIndex) => (
                                <div key={optionField.id} className="flex items-center">
                                  <input
                                    type="text"
                                    {...register(`questions.${questionIndex}.options.${optionIndex}.text`, { required: 'Option text is required' })}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeOption(optionIndex)}
                                    className="ml-2 text-red-600 hover:text-red-800"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => appendOption({ text: '' })}
                                className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => appendQuestion({
                    text: '',
                    type: 'checkbox',
                    section: 'SECTION 1',
                    is_required: false,
                    options: [{ text: '' }],
                  })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Question
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? 'Creating...' : 'Create Survey'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
