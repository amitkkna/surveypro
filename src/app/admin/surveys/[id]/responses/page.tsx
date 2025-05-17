'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

interface Response {
  id: string;
  created_at: string;
  respondent_id: string | null;
  respondent_email: string | null;
  question_text: string;
  question_type: string;
  response_text: string | null;
  option_text: string | null;
}

interface GroupedResponse {
  id: string;
  created_at: string;
  respondent_id: string | null;
  respondent_email: string | null;
  answers: {
    question_text: string;
    question_type: string;
    response_text: string | null;
    option_text: string | null;
  }[];
}

export default function SurveyResponses() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<any>(null);
  const [responses, setResponses] = useState<GroupedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
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

        // Fetch responses with question and option details
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select(`
            id,
            created_at,
            respondent_id,
            text_response,
            questions (
              id,
              text,
              type
            ),
            options (
              id,
              text
            ),
            respondents (
              id,
              email
            )
          `)
          .eq('survey_id', surveyId)
          .order('created_at', { ascending: false });

        if (responsesError) {
          throw responsesError;
        }

        // Transform the data
        const formattedResponses: Response[] = responsesData.map((response: any) => ({
          id: response.id,
          created_at: response.created_at,
          respondent_id: response.respondent_id,
          respondent_email: response.respondents?.email || null,
          question_text: response.questions?.text || 'Unknown Question',
          question_type: response.questions?.type || 'unknown',
          response_text: response.text_response,
          option_text: response.options?.text || null
        }));

        // Group responses by respondent and timestamp
        const groupedResponses: GroupedResponse[] = [];
        const responseMap = new Map();

        formattedResponses.forEach(response => {
          const key = `${response.respondent_id || 'anonymous'}-${response.created_at.split('T')[0]}`;

          if (!responseMap.has(key)) {
            responseMap.set(key, {
              id: response.id,
              created_at: response.created_at,
              respondent_id: response.respondent_id,
              respondent_email: response.respondent_email,
              answers: []
            });
          }

          responseMap.get(key).answers.push({
            question_text: response.question_text,
            question_type: response.question_type,
            response_text: response.response_text,
            option_text: response.option_text
          });
        });

        // Convert map to array
        responseMap.forEach(value => {
          groupedResponses.push(value);
        });

        setResponses(groupedResponses);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    if (surveyId) {
      fetchData();
    }
  }, [surveyId]);

  const exportToCSV = () => {
    // Flatten the responses for CSV export
    const flattenedData: any[] = [];

    responses.forEach(response => {
      const baseData = {
        'Submission Date': new Date(response.created_at).toLocaleString(),
        'Respondent Email': response.respondent_email || 'Anonymous'
      };

      // Create a row for each answer
      response.answers.forEach(answer => {
        flattenedData.push({
          ...baseData,
          'Question': answer.question_text,
          'Response': answer.response_text || answer.option_text || ''
        });
      });
    });

    // Convert to CSV
    const headers = Object.keys(flattenedData[0] || {}).join(',');
    const rows = flattenedData.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');

    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `survey-responses-${surveyId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <p className="text-center">Loading responses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
            <p>{error || 'Survey not found'}</p>
            <div className="mt-4">
              <Link href="/admin/surveys" className="text-indigo-600 hover:text-indigo-800">
                Back to Surveys
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Survey Responses</h1>
              <p className="text-sm text-gray-500">{survey.title}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={responses.length === 0}
              >
                Export to CSV
              </button>
              <Link
                href={`/admin/surveys/${surveyId}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Survey
              </Link>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No responses yet for this survey.</p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-4">Total responses: {responses.length}</p>

              <div className="space-y-8">
                {responses.map((response, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Response #{index + 1}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(response.created_at).toLocaleString()}
                        </p>
                        {response.respondent_email && (
                          <p className="text-sm text-gray-500">
                            Email: {response.respondent_email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Question
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Response
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {response.answers.map((answer, answerIndex) => (
                            <tr key={answerIndex}>
                              <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                                {answer.question_text}
                              </td>
                              <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                                {answer.response_text || answer.option_text || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
