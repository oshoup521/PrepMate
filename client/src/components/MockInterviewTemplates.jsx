import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MockInterviewTemplates = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    {
      id: 'frontend-react',
      title: 'Frontend Developer - React',
      company: 'Tech Startup',
      difficulty: 'medium',
      duration: '45 minutes',
      description: 'Focus on React, JavaScript ES6+, CSS, and modern frontend practices.',
      topics: ['React Hooks', 'State Management', 'Performance Optimization', 'Testing'],
      icon: '⚛️'
    },
    {
      id: 'backend-node',
      title: 'Backend Developer - Node.js',
      company: 'Enterprise Corp',
      difficulty: 'hard',
      duration: '60 minutes', 
      description: 'Node.js, Express, databases, API design, and system architecture.',
      topics: ['REST APIs', 'Database Design', 'Authentication', 'Scalability'],
      icon: '🚀'
    },
    {
      id: 'fullstack-general',
      title: 'Full Stack Developer',
      company: 'Mid-size Company',
      difficulty: 'medium',
      duration: '50 minutes',
      description: 'Both frontend and backend technologies with system design.',
      topics: ['Frontend Frameworks', 'Backend APIs', 'Database', 'DevOps Basics'],
      icon: '🔄'
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist',
      company: 'Analytics Firm',
      difficulty: 'hard',
      duration: '60 minutes',
      description: 'Machine learning, statistics, Python, and data analysis.',
      topics: ['ML Algorithms', 'Statistics', 'Python/R', 'Data Visualization'],
      icon: '📊'
    },
    {
      id: 'devops-engineer',
      title: 'DevOps Engineer',
      company: 'Cloud Company',
      difficulty: 'hard',
      duration: '55 minutes',
      description: 'Infrastructure, CI/CD, containerization, and cloud platforms.',
      topics: ['Docker/Kubernetes', 'CI/CD Pipelines', 'AWS/Azure', 'Monitoring'],
      icon: '☁️'
    },
    {
      id: 'mobile-developer',
      title: 'Mobile Developer',
      company: 'Mobile App Startup',
      difficulty: 'medium',
      duration: '45 minutes',
      description: 'iOS/Android development, React Native, or Flutter.',
      topics: ['Mobile Frameworks', 'Platform-specific Features', 'App Store', 'Performance'],
      icon: '📱'
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleStartTemplate = (template) => {
    // Navigate to interview with template parameters
    navigate('/interview', { 
      state: { 
        role: template.title,
        difficulty: template.difficulty,
        template: template 
      } 
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mock Interview Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Practice with realistic interview scenarios from top companies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">{template.icon}</div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty.toUpperCase()}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {template.title}
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {template.company} • {template.duration}
              </p>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {template.description}
              </p>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Key Topics:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {template.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => handleStartTemplate(template)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Start Interview
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          💡 Interview Tips
        </h2>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Practice explaining your thought process out loud</li>
          <li>• Ask clarifying questions before jumping into coding</li>
          <li>• Consider edge cases and error handling</li>
          <li>• Discuss time and space complexity</li>
          <li>• Be prepared to optimize your solution</li>
        </ul>
      </div>
    </div>
  );
};

export default MockInterviewTemplates;
