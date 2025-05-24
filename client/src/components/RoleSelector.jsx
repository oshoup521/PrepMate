import React, { useState } from 'react';

// Role definitions with icons and descriptions
const roles = [
  {
    id: "frontend",
    title: "Frontend Developer",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    description: "UI/UX, React, Angular, Vue"
  },
  {
    id: "backend",
    title: "Backend Developer",    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    description: "APIs, Databases, Node.js, Python"
  },
  {
    id: "fullstack",
    title: "Full Stack Developer",    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: "End-to-end development"
  },
  {
    id: "datascientist",
    title: "Data Scientist",    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    description: "ML, AI, Python, Statistics"
  },
  {
    id: "devops",
    title: "DevOps Engineer",    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    description: "CI/CD, Docker, Cloud"
  },
  {
    id: "product",
    title: "Product Manager",    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    description: "Strategy, Roadmap, User Stories"
  },
  {    id: "ux",
    title: "UX Designer",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    description: "User Research, Wireframes"
  },
  {    id: "qa",
    title: "QA Engineer",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Testing, Automation, QA"
  }
];

// Difficulty levels
const difficultyLevels = [
  { id: "beginner", name: "Beginner", description: "Basic interview questions" },
  { id: "intermediate", name: "Intermediate", description: "Standard interview depth" },
  { id: "advanced", name: "Advanced", description: "Challenging technical questions" }
];

const RoleSelector = ({ onRoleSelect, selectedRole, onDifficultySelect, selectedDifficulty }) => {
  const [difficulty, setDifficulty] = useState(selectedDifficulty || "intermediate");
  
  const handleRoleClick = (roleTitle) => {
    onRoleSelect(roleTitle);
  };
  
  const handleDifficultyChange = (e) => {
    const difficultyId = e.target.value;
    setDifficulty(difficultyId);
    if (onDifficultySelect) {
      onDifficultySelect(difficultyId);
    }
  };
  
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4 text-forest dark:text-sage">Choose Your Interview</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-semibold mb-3 text-forest/90 dark:text-sage/90">Select Role</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleClick(role.title)}
                className={`
                  card p-3 transition-all duration-200 flex items-center text-left
                  hover:shadow hover:-translate-y-1 border
                  ${selectedRole === role.title 
                    ? 'bg-sage/20 dark:bg-sage/10 border-forest dark:border-sage text-forest dark:text-sage' 
                    : 'bg-white dark:bg-dark-muted border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:border-olive dark:hover:border-sage/50'}
                `}
              >
                <div className={`p-2 rounded-full mr-2 ${selectedRole === role.title ? 'bg-forest/10 dark:bg-sage/10 text-forest dark:text-sage' : 'bg-light-border dark:bg-dark-border text-light-text/60 dark:text-dark-text/60'}`}>
                  {role.icon}
                </div>
                <div>
                  <div className="font-medium text-xs">{role.title}</div>
                  <div className="text-xs text-light-text/60 dark:text-dark-text/60">{role.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-semibold mb-3 text-forest/90 dark:text-sage/90">Select Difficulty</h3>
          <div className="flex flex-wrap gap-3">
            {difficultyLevels.map((level) => (
              <label 
                key={level.id}
                className={`
                  flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all border
                  ${difficulty === level.id 
                    ? 'bg-sage/20 dark:bg-sage/10 border-forest dark:border-sage text-forest dark:text-sage' 
                    : 'bg-white dark:bg-dark-muted border-light-border dark:border-dark-border hover:border-olive dark:hover:border-sage/50'}
                `}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={level.id}
                  checked={difficulty === level.id}
                  onChange={handleDifficultyChange}
                  className="sr-only"
                />
                <div 
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${difficulty === level.id 
                      ? 'border-forest dark:border-sage' 
                      : 'border-light-text/30 dark:border-dark-text/30'}
                  `}
                >
                  {difficulty === level.id && (
                    <div className="w-2 h-2 rounded-full bg-forest dark:bg-sage"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{level.name}</p>
                  <p className="text-xs text-light-text/60 dark:text-dark-text/60">{level.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
