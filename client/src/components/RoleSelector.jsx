import React from 'react';

const RoleSelector = ({ onRoleSelect, selectedRole, onDifficultySelect, selectedDifficulty }) => {
  const roles = [
    {
      id: 'software-engineer',
      title: 'Software Engineer',
      description: 'Full-stack development, algorithms, system design',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      id: 'frontend-developer',
      title: 'Frontend Developer',
      description: 'React, Vue, Angular, CSS, UI/UX principles',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      ),
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      id: 'backend-developer',
      title: 'Backend Developer',
      description: 'APIs, databases, microservices, cloud architecture',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/10',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      id: 'devops-engineer',
      title: 'DevOps Engineer',
      description: 'CI/CD, Docker, Kubernetes, AWS, monitoring',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/10',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    {
      id: 'data-scientist',
      title: 'Data Scientist',
      description: 'Machine learning, statistics, Python, R, analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/10',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'product-manager',
      title: 'Product Manager',
      description: 'Strategy, roadmaps, user research, stakeholder management',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
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
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    },
    { 
      id: 'intermediate', 
      title: 'Intermediate', 
      description: 'Mid-level complexity, practical scenarios',
      icon: '⚡',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
    },
    { 
      id: 'advanced', 
      title: 'Advanced', 
      description: 'Complex problems, system design',
      icon: '🚀',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Role Selection */}
      <div>
        <div className="text-center mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-light-text dark:text-dark-text mb-2">
            Choose Your Interview Role
          </h3>
          <p className="text-light-text/60 dark:text-dark-text/60 text-sm sm:text-base">
            Select the position you're preparing for to get tailored questions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => onRoleSelect(role.id)}
              className={`
                role-card group cursor-pointer transition-all duration-300
                ${selectedRole === role.id 
                  ? `${role.bgColor} ${role.borderColor} border-2 ring-4 ring-opacity-20 ring-offset-2 ring-offset-light-bg dark:ring-offset-dark-bg transform scale-[1.02] shadow-lg` 
                  : 'card card-interactive hover:shadow-md hover:scale-[1.01]'
                }
              `}
            >
              <div className="p-4 sm:p-6">
                <div className={`
                  w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-all duration-300
                  ${selectedRole === role.id 
                    ? `bg-gradient-to-r ${role.color} text-white shadow-lg` 
                    : `${role.bgColor} ${role.textColor} group-hover:scale-110`
                  }
                `}>
                  {role.icon}
                </div>

                <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2 group-hover:text-forest dark:group-hover:text-sage transition-colors">
                  {role.title}
                </h4>
                
                <p className="text-sm text-light-text/70 dark:text-dark-text/70 leading-relaxed">
                  {role.description}
                </p>

                {selectedRole === role.id && (
                  <div className="mt-4 flex items-center text-sm font-medium text-forest dark:text-sage">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Selected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className={`transition-all duration-500 ${selectedRole ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
        <div className="text-center mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-light-text dark:text-dark-text mb-2">
            Select Difficulty Level
          </h3>
          <p className="text-light-text/60 dark:text-dark-text/60 text-sm sm:text-base">
            Choose the complexity level that matches your experience
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {difficulties.map((difficulty) => (
            <div
              key={difficulty.id}
              onClick={() => selectedRole && onDifficultySelect(difficulty.id)}
              className={`
                difficulty-card group cursor-pointer transition-all duration-300
                ${!selectedRole ? 'opacity-50 cursor-not-allowed' : ''}
                ${selectedDifficulty === difficulty.id 
                  ? 'bg-forest/10 dark:bg-sage/10 border-2 border-forest dark:border-sage ring-4 ring-forest/20 dark:ring-sage/20 ring-offset-2 ring-offset-light-bg dark:ring-offset-dark-bg transform scale-[1.02] shadow-lg' 
                  : 'card card-interactive hover:shadow-md hover:scale-[1.01]'
                }
              `}
            >
              <div className="p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-3">
                  {difficulty.icon}
                </div>
                
                <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                  {difficulty.title}
                </h4>
                
                <p className="text-sm text-light-text/70 dark:text-dark-text/70 mb-4 leading-relaxed">
                  {difficulty.description}
                </p>

                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${difficulty.color}`}>
                  {difficulty.title} Level
                </div>

                {selectedDifficulty === difficulty.id && (
                  <div className="mt-4 flex items-center justify-center text-sm font-medium text-forest dark:text-sage">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Selected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedRole && selectedDifficulty && (
        <div className="animate-fadeIn">
          <div className="card bg-gradient-to-r from-forest/5 to-sage/5 dark:from-forest/10 dark:to-sage/10 border border-forest/20 dark:border-sage/20">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-forest dark:bg-sage rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-light-text dark:text-dark-text">
                      Ready to Start!
                    </h4>
                    <p className="text-sm text-light-text/70 dark:text-dark-text/70">
                      {roles.find(r => r.id === selectedRole)?.title} • {difficulties.find(d => d.id === selectedDifficulty)?.title} Level
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-forest dark:text-sage">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">Scroll down to begin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
