'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { defaultSurvey } from '@/data/defaultSurvey';

export default function DefaultSurveyQRCode() {
  const [loading, setLoading] = useState(true);
  const [surveyUrl, setSurveyUrl] = useState('');
  const [qrSize, setQrSize] = useState(256);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fgColor, setFgColor] = useState('#000000');
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set the survey URL
    const baseUrl = window.location.origin;
    setSurveyUrl(`${baseUrl}/surveys/default-survey`);

    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const downloadQRCode = (format: 'png' | 'svg') => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector('canvas');
    const svg = qrRef.current.querySelector('svg');

    if (!canvas && !svg) return;

    let url;
    let filename;

    if (format === 'png' && canvas) {
      url = canvas.toDataURL('image/png');
      filename = `survey-qr-default.png`;
    } else if (format === 'svg' && svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      url = URL.createObjectURL(svgBlob);
      filename = `survey-qr-default.svg`;
    } else {
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = defaultSurvey.title;
    const description = defaultSurvey.description;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              margin: 20px auto;
              max-width: 500px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 20px auto;
            }
            .url {
              font-size: 12px;
              color: #666;
              margin-top: 20px;
              word-break: break-all;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${includeTitle ? `<h1>${title}</h1>` : ''}
            ${includeDescription ? `<p>${description}</p>` : ''}
            <div class="qr-code">
              ${qrRef.current?.innerHTML || ''}
            </div>
            <div class="url">
              ${surveyUrl}
            </div>
            <div class="no-print">
              <button onclick="window.print();" style="margin-top: 20px; padding: 10px 20px;">Print</button>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <p className="text-center">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>
              <p className="text-sm text-gray-500">{defaultSurvey.title}</p>
            </div>
            <Link
              href={`/admin/surveys/default-survey`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Survey
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">QR Code Options</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="qrSize" className="block text-sm font-medium text-gray-700">
                      Size (px)
                    </label>
                    <input
                      type="range"
                      id="qrSize"
                      min="128"
                      max="512"
                      step="32"
                      value={qrSize}
                      onChange={(e) => setQrSize(parseInt(e.target.value))}
                      className="mt-1 block w-full"
                    />
                    <div className="text-sm text-gray-500 mt-1">{qrSize}px</div>
                  </div>

                  <div>
                    <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700">
                      Background Color
                    </label>
                    <div className="flex items-center mt-1">
                      <input
                        type="color"
                        id="bgColor"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-8 w-8 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="ml-2 block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fgColor" className="block text-sm font-medium text-gray-700">
                      Foreground Color
                    </label>
                    <div className="flex items-center mt-1">
                      <input
                        type="color"
                        id="fgColor"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="h-8 w-8 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="ml-2 block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Print Options
                    </label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <input
                          id="includeTitle"
                          type="checkbox"
                          checked={includeTitle}
                          onChange={(e) => setIncludeTitle(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includeTitle" className="ml-2 block text-sm text-gray-900">
                          Include title when printing
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="includeDescription"
                          type="checkbox"
                          checked={includeDescription}
                          onChange={(e) => setIncludeDescription(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includeDescription" className="ml-2 block text-sm text-gray-900">
                          Include description when printing
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => downloadQRCode('png')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Download as PNG
                </button>
                <button
                  onClick={() => downloadQRCode('svg')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Download as SVG
                </button>
                <button
                  onClick={printQRCode}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Print QR Code
                </button>
              </div>
            </div>

            <div>
              <div className="flex flex-col items-center">
                <div ref={qrRef} className="border border-gray-200 p-4 rounded-lg bg-white">
                  <QRCodeCanvas
                    value={surveyUrl}
                    size={qrSize}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Survey URL:</p>
                  <p className="text-xs text-gray-700 break-all">{surveyUrl}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
