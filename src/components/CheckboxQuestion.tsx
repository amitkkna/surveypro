'use client';

import { useState, useEffect } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface Option {
  text: string;
}

interface CheckboxQuestionProps {
  question: {
    text: string;
    options: Option[];
    is_required: boolean;
  };
  index: number;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: any;
}

export default function CheckboxQuestion({
  question,
  index,
  register,
  setValue,
  watch,
  errors
}: CheckboxQuestionProps) {
  // Determine the selection limit for this question
  const getLimit = () => {
    if (question.text.includes("(Select up to 3)")) return 3;
    if (question.text.includes("(Select up to 2)")) return 2;
    return 999; // No limit
  };

  const limit = getLimit();
  const fieldName = `question_${index}`;

  // Only initialize if the field is empty
  useEffect(() => {
    const currentValue = watch(fieldName);
    if (!currentValue || !Array.isArray(currentValue) || currentValue.length === 0) {
      setValue(fieldName, [], { shouldValidate: false });
    }
  }, [fieldName, setValue, watch]);

  // Register the field for validation
  useEffect(() => {
    const registration = register(fieldName, {
      required: question.is_required ? 'Please select at least one option' : false,
      validate: (value) => {
        if (limit === 3) {
          return !value || !Array.isArray(value) || value.length <= 3 ||
            'Please select no more than 3 options';
        }
        if (limit === 2) {
          return !value || !Array.isArray(value) || value.length <= 2 ||
            'Please select no more than 2 options';
        }
        return true;
      }
    });

    // Log the current field value
    console.log(`Registered field ${fieldName} with current value:`, watch(fieldName));

    return () => {
      // This is just for logging, React Hook Form handles unregistering
      console.log(`Component unmounting, field ${fieldName} value:`, watch(fieldName));
    };
  }, [fieldName, register, limit, question.is_required, watch]);

  // Get current selected values
  const selectedValues = watch(fieldName) || [];

  // Handle checkbox change
  const handleChange = (optionText: string, isChecked: boolean) => {
    // Get current values
    const currentValues = [...selectedValues];

    if (isChecked) {
      // Don't add if already at limit
      if (currentValues.length >= limit) return;

      // Add the value
      setValue(fieldName, [...currentValues, optionText], { shouldValidate: true });
    } else {
      // Remove the value
      setValue(fieldName, currentValues.filter(v => v !== optionText), { shouldValidate: true });
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Selection limit information */}
      {limit < 999 && (
        <p className="text-sm text-gray-500 mb-2">
          Please select up to {limit} options
          (Selected: {selectedValues.length}/{limit})
        </p>
      )}

      {/* Options */}
      {question.options.map((option, optionIndex) => {
        const isChecked = selectedValues.includes(option.text);
        const isDisabled = !isChecked && selectedValues.length >= limit;

        return (
          <div key={optionIndex} className="flex items-center">
            <input
              id={`question_${index}_option_${optionIndex}`}
              type="checkbox"
              value={option.text}
              checked={isChecked}
              disabled={isDisabled}
              onChange={(e) => handleChange(option.text, e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor={`question_${index}_option_${optionIndex}`}
              className="ml-3 block text-sm text-gray-700 cursor-pointer"
              onClick={() => {
                if (isChecked || !isDisabled) {
                  handleChange(option.text, !isChecked);
                }
              }}
            >
              {option.text}
            </label>
          </div>
        );
      })}

      {/* Error message */}
      {errors[fieldName] && (
        <p className="mt-1 text-sm text-red-600">
          {errors[fieldName]?.message as string}
        </p>
      )}
    </div>
  );
}
