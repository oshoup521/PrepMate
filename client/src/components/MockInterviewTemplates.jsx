import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './LoadingSpinner';

const MockInterviewTemplates = () => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);

  const templates = [
    {
      id: 'frontend-react',
      title: 'Frontend Developer — React',
      role: 'Frontend Developer',
      company: 'Tech Startup',
      difficulty: 'medium',
      duration: '45 min',
      description: 'React, JavaScript ES6+, CSS, and modern frontend practices.',
      topics: ['React Hooks', 'State Management', 'Performance', 'Testing'],
      icon: '⚛️',
      strip: 'linear-gradient(to right, #22c55e, #10b981)',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      id: 'backend-node',
      title: 'Backend Developer — Node.js',
      role: 'Backend Developer',
      company: 'Enterprise Corp',
      difficulty: 'hard',
      duration: '60 min',
      description: 'Node.js, Express, databases, API design, and system architecture.',
      topics: ['REST APIs', 'Database Design', 'Auth', 'Scalability'],
      icon: '⚙️',
      strip: 'linear-gradient(to right, #a855f7, #6366f1)',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      id: 'fullstack-general',
      title: 'Full Stack Developer',
      role: 'Full Stack Developer',
      company: 'Mid-size Company',
      difficulty: 'medium',
      duration: '50 min',
      description: 'Frontend + backend technologies with system design fundamentals.',
      topics: ['Frontend', 'Backend APIs', 'Database', 'DevOps Basics'],
      icon: '🔄',
      strip: 'linear-gradient(to right, #537D5D, #73946B)',
      iconBg: 'bg-forest/10 dark:bg-sage/10',
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist',
      role: 'Data Scientist',
      company: 'Analytics Firm',
      difficulty: 'hard',
      duration: '60 min',
      description: 'Machine learning, statistics, Python, and data analysis techniques.',
      topics: ['ML Algorithms', 'Statistics', 'Python / R', 'Visualization'],
      icon: '📊',
      strip: 'linear-gradient(to right, #f97316, #ef4444)',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      id: 'devops-engineer',
      title: 'DevOps Engineer',
      role: 'DevOps Engineer',
      company: 'Cloud Company',
      difficulty: 'hard',
      duration: '55 min',
      description: 'Infrastructure, CI/CD pipelines, containerization, and cloud platforms.',
      topics: ['Docker / K8s', 'CI/CD', 'AWS / Azure', 'Monitoring'],
      icon: '☁️',
      strip: 'linear-gradient(to right, #0ea5e9, #6366f1)',
      iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    },
    {
      id: 'product-manager',
      title: 'Product Manager',
      role: 'Product Manager',
      company: 'Product Studio',
      difficulty: 'medium',
      duration: '45 min',
      description: 'Product strategy, user research, roadmaps, and cross-functional leadership.',
      topics: ['Strategy', 'User Research', 'Roadmapping', 'Metrics'],
      icon: '📋',
      strip: 'linear-gradient(to right, #ec4899, #f43f5e)',
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    },
  ];

  const difficultyConfig = {
    easy:   { label: 'Easy',   classes: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    medium: { label: 'Medium', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
    hard:   { label: 'Hard',   classes: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
  };

  const handleStartTemplate = (template) => {
    navigate('/interview', {
      state: { role: template.role, difficulty: template.difficulty, template },
    });
  };

  return (
    <div className="container-responsive section-spacing">

      {/* Page Header */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-light-text dark:text-dark-text mb-2">
          Interview <span className="gradient-text">Templates</span>
        </h1>
        <p className="text-light-text/60 dark:text-dark-text/60 text-sm sm:text-base">
          Practise with realistic scenarios designed for specific roles and experience levels.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {templates.map((template) => {
          const diff = difficultyConfig[template.difficulty] ?? difficultyConfig.medium;
          return (
            <div
              key={template.id}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                card flex flex-col overflow-hidden transition-all duration-200
                ${hoveredId === template.id ? 'shadow-md -translate-y-0.5' : ''}
              `}
            >
              {/* Accent strip – inline style guarantees it's never purged by Tailwind */}
              <div className="h-1.5 w-full" style={{ background: template.strip }} />

              <div className="p-5 flex flex-col flex-1">
                {/* Icon + difficulty */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${template.iconBg}`}>
                    {template.icon}
                  </div>
                  <span className={`status-badge ${diff.classes}`}>
                    {diff.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-light-text dark:text-dark-text mb-1 leading-snug">
                  {template.title}
                </h3>

                {/* Meta */}
                <p className="text-xs text-light-text/50 dark:text-dark-text/50 mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {template.company}
                  <span className="text-light-border dark:text-dark-border">•</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {template.duration}
                </p>

                {/* Description */}
                <p className="text-sm text-light-text/70 dark:text-dark-text/70 mb-4 leading-relaxed">
                  {template.description}
                </p>

                {/* Topics */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {template.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-xs font-medium bg-forest/8 text-forest dark:bg-sage/10 dark:text-sage border border-forest/15 dark:border-sage/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                {/* CTA – pushed to bottom */}
                <div className="mt-auto">
                  <Button
                    onClick={() => handleStartTemplate(template)}
                    variant="primary"
                    fullWidth
                    size="md"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    Start Interview
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Banner */}
      <div className="mt-10 card p-5 sm:p-6 bg-gradient-to-br from-forest/5 to-olive/5 dark:from-sage/5 dark:to-sand/5 border-forest/15 dark:border-sage/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-forest/10 dark:bg-sage/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-forest dark:text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-light-text dark:text-dark-text mb-2">
              Interview Tips
            </h2>
            <ul className="text-sm text-light-text/70 dark:text-dark-text/70 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-forest dark:text-sage mt-0.5">•</span>
                Think out loud — explain your reasoning as you go
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest dark:text-sage mt-0.5">•</span>
                Ask clarifying questions before jumping to answers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest dark:text-sage mt-0.5">•</span>
                Consider edge cases and error handling
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest dark:text-sage mt-0.5">•</span>
                Review your answer and suggest improvements at the end
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockInterviewTemplates;
