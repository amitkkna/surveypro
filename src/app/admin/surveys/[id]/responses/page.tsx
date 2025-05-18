'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Define interfaces
interface Answer {
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
  answers: Answer[];
}

interface QuestionStat {
  totalResponses: number;
  optionCounts: Record<string, number>;
  textResponses: string[];
}

// Main component
export default function SurveyResponses() {
  // Get survey ID from URL params
  const params = useParams();
  const surveyId = params.id as string;

  // State variables
  const [survey, setSurvey] = useState<any>(null);
  const [responses, setResponses] = useState<GroupedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [filterType, setFilterType] = useState('all');
  const [questionStats, setQuestionStats] = useState<Record<string, QuestionStat>>({});

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

        // Process response data for visualization
        const questionStatsData: any = {};

        // Collect all unique questions
        const allQuestions = new Set<string>();
        formattedResponses.forEach(response => {
          allQuestions.add(response.question_text);
        });

        // Initialize stats for each question
        allQuestions.forEach(question => {
          questionStatsData[question] = {
            totalResponses: 0,
            optionCounts: {},
            textResponses: []
          };
        });

        // Populate stats
        formattedResponses.forEach(response => {
          const question = response.question_text;
          questionStatsData[question].totalResponses++;

          if (response.option_text) {
            // For multiple choice questions
            if (!questionStatsData[question].optionCounts[response.option_text]) {
              questionStatsData[question].optionCounts[response.option_text] = 0;
            }
            questionStatsData[question].optionCounts[response.option_text]++;
          } else if (response.response_text) {
            // For text questions
            questionStatsData[question].textResponses.push(response.response_text);
          }
        });

        // Sort responses by date (newest first) by default
        groupedResponses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setQuestionStats(questionStatsData);
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

  // Render loading state
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

  // Render error state
  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
            <p>{error || 'Survey not found'}</p>
            <div className="mt-4">
              <Link href="/admin" className="text-indigo-600 hover:text-indigo-800">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg p-6">
          {/* Header with title and actions */}
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export to CSV
              </button>
              <Link
                href={`/admin/surveys/${surveyId}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Survey
              </Link>
            </div>
          </div>

          {/* Dashboard Stats */}
          {responses.length > 0 && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Responses Card */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Responses</p>
                    <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
                  </div>
                </div>
              </div>

              {/* Last Response Card */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Response</p>
                    <p className="text-lg font-bold text-gray-900">{new Date(responses[0].created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Completion Rate Card */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {responses.length > 0 ? '100%' : '0%'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Responses Message */}
          {responses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No responses yet for this survey.</p>
            </div>
          ) : (
            <>
              {/* Response Summary Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Summary</h2>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-center py-4">
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900 mb-2">Total Responses: {responses.length}</p>
                      <p className="text-sm text-gray-500">
                        Last response received on {new Date(responses[0].created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question-specific Insights */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Insights</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Map through question stats */}
                  {Object.keys(questionStats).map((question, index) => {
                    const stats = questionStats[question];
                    return (
                      <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Question header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                          <h3 className="text-lg font-medium text-gray-900 truncate" title={question}>
                            {question.length > 50 ? question.substring(0, 50) + '...' : question}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {stats.totalResponses} {stats.totalResponses === 1 ? 'response' : 'responses'}
                          </p>
                        </div>

                        {/* Question stats */}
                        <div className="px-6 py-4">
                          {/* Multiple choice responses */}
                          {Object.keys(stats.optionCounts).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Response Distribution</h4>
                              <div className="space-y-2">
                                {Object.keys(stats.optionCounts).map((option, optIndex) => {
                                  const count = stats.optionCounts[option];
                                  const percentage = Math.round((count / stats.totalResponses) * 100);

                                  return (
                                    <div key={optIndex}>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{option}</span>
                                        <span className="text-gray-900 font-medium">{count} ({percentage}%)</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                        <div
                                          className="bg-indigo-600 h-2.5 rounded-full"
                                          style={{ width: `${percentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Text responses */}
                          {Object.keys(stats.optionCounts).length === 0 && stats.textResponses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Text Responses</h4>
                              <div className="max-h-40 overflow-y-auto">
                                <ul className="space-y-2">
                                  {stats.textResponses.slice(0, 5).map((text, textIndex) => (
                                    <li key={textIndex} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                      "{text}"
                                    </li>
                                  ))}
                                  {stats.textResponses.length > 5 && (
                                    <li className="text-sm text-gray-500 italic">
                                      + {stats.textResponses.length - 5} more responses
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* No data */}
                          {Object.keys(stats.optionCounts).length === 0 && stats.textResponses.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No response data available</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Response Filtering and Sorting */}
              <div className="mb-6 flex flex-wrap gap-4 items-center">
                {/* Sort dropdown */}
                <div>
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    id="sortBy"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="date-desc">Date (Newest First)</option>
                    <option value="date-asc">Date (Oldest First)</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                {/* Filter dropdown */}
                <div>
                  <label htmlFor="filterBy" className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
                  <select
                    id="filterBy"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Responses</option>
                    <option value="with-email">With Email Only</option>
                    <option value="anonymous">Anonymous Only</option>
                  </select>
                </div>

                {/* Export button */}
                <div className="ml-auto">
                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Detailed Report
                  </button>
                </div>
              </div>

              {/* Individual Responses */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Individual Responses</h2>

                {/* Filter and sort responses */}
                <div className="space-y-6">
                  {responses
                    .filter(response => {
                      if (filterType === 'all') return true;
                      if (filterType === 'with-email') return !!response.respondent_email;
                      if (filterType === 'anonymous') return !response.respondent_email;
                      return true;
                    })
                    .sort((a, b) => {
                      if (sortOrder === 'date-desc') {
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      } else if (sortOrder === 'date-asc') {
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                      } else if (sortOrder === 'email') {
                        const emailA = a.respondent_email || '';
                        const emailB = b.respondent_email || '';
                        return emailA.localeCompare(emailB);
                      }
                      return 0;
                    })
                    .map((response, index) => (
                      <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Response header */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                Response #{index + 1}
                              </h3>
                              <div className="flex items-center mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-500">
                                  {new Date(response.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Email badge */}
                            {response.respondent_email && (
                              <div className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">
                                  {response.respondent_email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Response answers table */}
                        <div className="px-6 py-4">
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
                                <tr key={answerIndex} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                                    {answer.question_text}
                                  </td>
                                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                                    {answer.response_text || answer.option_text || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
