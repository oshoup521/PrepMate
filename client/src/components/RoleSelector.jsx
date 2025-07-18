import React from 'react';

const RoleSelector = ({ onRoleSelect, selectedRole, onDifficultySelect, selectedDifficulty }) => {
  const roles = [
    {
      id: 'software-engineer',
      title: 'Software Engineer',
      description: 'Full-stack development, algorithms, system design',
      icon: '💻',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      id: 'frontend-developer',
      title: 'Frontend Developer',
      description: 'React, Vue, Angular, CSS, UI/UX principles',
      icon: '🎨',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      id: 'backend-developer',
      title: 'Backend Developer',
      description: 'Node.js, Python, Java, databases, APIs',
      icon: '⚙️',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/10',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist',
      description: 'Machine learning, Python, statistics, analytics',
      icon: '📊',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/10',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    {
      id: 'devops-engineer',
      title: 'DevOps Engineer',
      description: 'CI/CD, Docker, Kubernetes, cloud platforms',
      icon: '🔧',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/10',
      textColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-800'
    },
    {
      id: 'product-manager',
      title: 'Product Manager',
      description: 'Strategy, roadmaps, user research, analytics',
      icon: '📋',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50 dark:bg-pink-900/10',
      textColor: 'text-pink-600 dark:text-pink-400',
      borderColor: 'border-pink-200 dark:border-pink-800'
    }
  ];

  const difficulties = [
    { 
      id: 'beginner', 
      title: 'Beginner', 
      description: 'Entry-level questions, basic concepts',
      icon: '🌱',
      color: 'from-green-400 to-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    { 
      id: 'intermediate', 
      title: 'Intermediate', 
      description: 'Mid-level questions, practical scenarios',
      icon: '⚡',
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    { 
      id: 'advanced', 
      title: 'Advanced', 
      description: 'Senior-level questions, complex problems',
      icon: '🚀',
      color: 'from-red-400 to-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/10',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  ];

  return (
    <div className="p-4 space-y-8">
      {/* Role Selection */}
      <div>
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-3">
          Choose Your Interview Role
        </h3>
        <p className="text-sm text-light-text/60 dark:text-dark-text/60 mb-4">
          Select the position you're preparing for to get tailored questions
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => onRoleSelect(role.id)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${selectedRole === role.id 
                  ? `${role.borderColor} ${role.bgColor} shadow-lg ring-2 ring-offset-2 ring-forest/20 dark:ring-sage/20` 
                  : 'border-light-border dark:border-dark-border hover:border-forest/40 dark:hover:border-sage/40 hover:shadow-md'
                }
                bg-white dark:bg-dark-muted
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{role.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm ${selectedRole === role.id ? role.textColor : 'text-light-text dark:text-dark-text'}`}>
                    {role.title}
                  </h4>
                  <p className="text-xs text-light-text/60 dark:text-dark-text/60 mt-1 truncate">
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div>
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-3">
          Select Difficulty Level
        </h3>
        <p className="text-sm text-light-text/60 dark:text-dark-text/60 mb-4">
          Choose the complexity level that matches your experience
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.id}
              onClick={() => onDifficultySelect(difficulty.id)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-center
                ${selectedDifficulty === difficulty.id 
                  ? `${difficulty.borderColor} ${difficulty.bgColor} shadow-lg ring-2 ring-offset-2 ring-forest/20 dark:ring-sage/20` 
                  : 'border-light-border dark:border-dark-border hover:border-forest/40 dark:hover:border-sage/40 hover:shadow-md'
                }
                bg-white dark:bg-dark-muted
              `}
            >
              <div className="text-2xl mb-2">{difficulty.icon}</div>
              <h4 className={`font-medium text-sm ${selectedDifficulty === difficulty.id ? difficulty.textColor : 'text-light-text dark:text-dark-text'}`}>
                {difficulty.title}
              </h4>
              <p className="text-xs text-light-text/60 dark:text-dark-text/60 mt-1">
                {difficulty.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
