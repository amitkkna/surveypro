export const defaultSurvey = {
  title: "PROFESSIONAL CONCERNS & WORKPLACE CONDITIONS SURVEY",
  description: "A comprehensive survey to understand workplace challenges and professional concerns across different sectors.",
  questions: [
    {
      text: "Which sector do you work in?",
      type: "radio",
      section: "SECTION 1: PROFESSIONAL BACKGROUND (2 MINS)",
      is_required: true,
      options: [
        { text: "IT / Software" },
        { text: "Healthcare" },
        { text: "Education" },
        { text: "Finance / Banking" },
        { text: "Legal / Judiciary" },
        { text: "Government / Public Sector" },
        { text: "Entrepreneurship / Startups" },
        { text: "Civil Society / NGOs" },
        { text: "Media / Creative Industry" },
        { text: "Other" }
      ]
    },
    {
      text: "How many years of professional experience do you have?",
      type: "radio",
      section: "SECTION 1: PROFESSIONAL BACKGROUND (2 MINS)",
      is_required: true,
      options: [
        { text: "Less than 2 years" },
        { text: "2–5 years" },
        { text: "6–10 years" },
        { text: "11–20 years" },
        { text: "More than 20 years" }
      ]
    },
    {
      text: "What is your current work arrangement?",
      type: "radio",
      section: "SECTION 1: PROFESSIONAL BACKGROUND (2 MINS)",
      is_required: true,
      options: [
        { text: "Full-time employee" },
        { text: "Part-time employee" },
        { text: "Freelancer / Consultant" },
        { text: "Self-employed / Entrepreneur" },
        { text: "Other" }
      ]
    },
    {
      text: "What are the top challenges you face in your profession? (Select up to 3) *",
      type: "checkbox",
      section: "SECTION 2: WORKPLACE CHALLENGES (4 MINS)",
      is_required: true,
      options: [
        { text: "Long working hours / work-life imbalance" },
        { text: "Low or delayed compensation" },
        { text: "Poor infrastructure or digital tools" },
        { text: "Lack of career growth or skill development" },
        { text: "Bureaucratic or regulatory hurdles" },
        { text: "Workplace discrimination / favoritism" },
        { text: "Harassment or lack of grievance mechanisms" },
        { text: "Stress, burnout, or mental health concerns" },
        { text: "Lack of supportive HR policies (e.g. maternity/paternity leave, flexible work)" },
        { text: "Corruption or lack of accountability" },
        { text: "Other" }
      ]
    },
    {
      text: "How satisfied are you with the overall work environment in your field?",
      type: "radio",
      section: "SECTION 2: WORKPLACE CHALLENGES (4 MINS)",
      is_required: true,
      options: [
        { text: "Very satisfied" },
        { text: "Somewhat satisfied" },
        { text: "Neutral" },
        { text: "Somewhat dissatisfied" },
        { text: "Very dissatisfied" }
      ]
    },
    {
      text: "What kind of support would make your work life better? (Select up to 2) *",
      type: "checkbox",
      section: "SECTION 2: WORKPLACE CHALLENGES (4 MINS)",
      is_required: true,
      options: [
        { text: "Policy or regulatory reforms" },
        { text: "Stronger legal safeguards and complaint redressal" },
        { text: "Professional networking and mentorship" },
        { text: "Easier access to credit, finance or funding" },
        { text: "Skilling/upskilling and career guidance" },
        { text: "Platforms to voice concerns or give feedback" },
        { text: "Awareness campaigns about workplace rights" }
      ]
    },
    {
      text: "Do you feel your work is fairly recognized and valued?",
      type: "radio",
      section: "SECTION 3: INCLUSION AND WELLBEING (2 MINS)",
      is_required: true,
      options: [
        { text: "Yes" },
        { text: "No" },
        { text: "Sometimes" }
      ]
    },
    {
      text: "Have you or a colleague ever faced discrimination or harassment at work?",
      type: "radio",
      section: "SECTION 3: INCLUSION AND WELLBEING (2 MINS)",
      is_required: true,
      options: [
        { text: "Frequently" },
        { text: "Occasionally" },
        { text: "Rarely" },
        { text: "Never" },
        { text: "Prefer not to answer" }
      ]
    },
    {
      text: "(For women and gender minorities): Are workplace safety and anti-harassment policies effectively implemented in your organization?",
      type: "radio",
      section: "SECTION 3: INCLUSION AND WELLBEING (2 MINS)",
      is_required: false,
      options: [
        { text: "Yes, effectively" },
        { text: "Policies exist, but not well enforced" },
        { text: "No such policies in place" },
        { text: "Don't know / Not applicable" }
      ]
    },
    {
      text: "What are the best ways to address the issues professionals face? (Select up to 2) *",
      type: "checkbox",
      section: "SECTION 4: SUGGESTIONS & FOLLOW-UP (2 MINS)",
      is_required: true,
      options: [
        { text: "Raise public awareness through media" },
        { text: "Facilitate direct dialogue with government/industry" },
        { text: "Organize consultations or town halls" },
        { text: "Develop support networks among professionals" },
        { text: "Promote access to skill and career services" },
        { text: "Legal assistance and rights education" }
      ]
    },
    {
      text: "Would you like to stay informed about future consultations or professional forums?",
      type: "radio",
      section: "SECTION 4: SUGGESTIONS & FOLLOW-UP (2 MINS)",
      is_required: true,
      options: [
        { text: "Yes (please provide email/contact)" },
        { text: "No" },
        { text: "Maybe later" }
      ]
    },
    {
      text: "Any additional thoughts, concerns, or suggestions?",
      type: "text",
      section: "SECTION 4: SUGGESTIONS & FOLLOW-UP (2 MINS)",
      is_required: false,
      options: []
    }
  ]
};
