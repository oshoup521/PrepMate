# PrepMate: AI-Powered Interview Coach

An intuitive, responsive web application that simulates technical interviews using AI (Google's Gemini API) to provide personalized feedback, helping users improve their interview skills and boost confidence.

![PrepMate](https://github.com/yourusername/PrepMate/raw/main/client/public/preview.png)

## Features

- **Role-specific interviews:** Select from 8 tech roles (Frontend, Backend, Full Stack, Data Scientist, DevOps, Product Manager, UX Designer, QA Engineer)
- **AI-powered questions:** Generates relevant technical questions tailored to your selected role
- **Real-time feedback:** Get instant, personalized feedback on your responses
- **Performance analytics:** Receive numerical scores, improvement suggestions, and comprehensive interview summaries
- **Responsive design:** Optimized mobile and desktop experience with dark/light theme support

## Tech Stack

| Layer    | Technology                   | Description                                     |
| -------- | ---------------------------- | ----------------------------------------------- |
| Frontend | React + Vite + Tailwind CSS  | Modern, responsive UI with utility-first CSS    |
| Backend  | NestJS + TypeScript          | Scalable, type-safe server architecture         |
| AI Model | Google's Gemini API          | Advanced language model for realistic interviews |
| State    | React Context API            | Efficient state management with theme support   |

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))
- Modern browser with support for CSS Grid and Flexbox

### Installation

#### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory (use `.env.example` as a template):
   ```powershell
   Copy-Item .env.example .env
   ```
   Then edit the `.env` file to add your Gemini API key (obtain from [Google AI Studio](https://makersuite.google.com/app/apikey)) and adjust other settings as needed.

4. Start the server:
   ```bash
   npm run start:dev
   ```

#### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the client directory (use `.env.example` as a template):
   ```powershell
   Copy-Item .env.example .env
   ```
   Then edit the `.env` file to configure the app settings if needed.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### UI Design Features

The PrepMate interface has been carefully crafted with the following design principles:

- **Clean, minimalist UI**: Focus on content with distraction-free design
- **Responsive layout**: Adapts seamlessly between mobile and desktop
- **Optimized component sizing**: Properly proportioned UI elements for better visual hierarchy
- **Accessible color schemes**: WCAG-compliant contrast ratios in both light and dark modes
- **Intuitive navigation**: Clear user flow from role selection to interview completion
- **Micro-interactions**: Subtle animations and transitions for better user engagement

## Project Structure

```
PrepMate/
├── client/                  # React frontend with Vite
│   ├── public/              # Static files
│   └── src/                 # Source code
│       ├── components/      # React components
│       │   ├── ChatInterface.jsx    # Interview chat UI
│       │   ├── ConfettiEffect.jsx   # Celebration animation
│       │   ├── InterviewSession.jsx # Main interview flow
│       │   ├── InterviewSummary.jsx # Results and feedback
│       │   ├── KeyboardShortcuts.jsx # Accessibility shortcuts
│       │   ├── RoleSelector.jsx     # Role selection interface
│       │   └── ThemeToggle.jsx      # Light/dark mode switcher
│       ├── contexts/        # React context providers
│       │   └── ThemeContext.jsx     # Theme management
│       ├── services/        # API services
│       │   └── interviewService.js  # Gemini API integration
│       ├── assets/          # Images and other assets
│       ├── App.css          # Global styles
│       ├── index.css        # Tailwind setup
│       └── App.jsx          # Main application component
│
└── server/                  # NestJS backend
    └── src/                 # Source code
        ├── interview/       # Interview module
        │   ├── interview.controller.ts # API endpoints
        │   ├── interview.service.ts    # Business logic & AI integration 
        │   └── interview.module.ts     # Module definition
        └── main.ts          # Entry point
```

## Technical Implementation

### Frontend Architecture
- **Component-Based Structure**: Modular design with reusable components
- **Context API**: Efficient state management for theming and user preferences
- **Tailwind CSS**: Utility-first approach for consistent styling and reduced CSS overhead
- **Responsive Design**: Mobile-first implementation with adaptive layouts
- **Optimized Renders**: Careful component separation to prevent unnecessary re-renders

### Backend Architecture
- **RESTful API**: Clean, resource-oriented endpoints
- **Dependency Injection**: NestJS's powerful DI container for better testability
- **Service Abstraction**: Separation of concerns between controllers and business logic
- **AI Integration**: Optimized prompting strategies for the Gemini API

### Performance Optimizations
- **Lazy Loading**: Components loaded only when needed
- **Efficient Animations**: Hardware-accelerated CSS transitions
- **Debounced Inputs**: Prevents excessive API calls during user typing
- **Optimized Asset Delivery**: Properly sized SVG icons and minimal dependencies

## Key Features Breakdown

### 1. Role-Based Interview Preparation
Choose from a variety of tech roles including Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, DevOps Engineer, Product Manager, UX Designer, and QA Engineer.

### 2. Interactive Interview Experience
Engage in a realistic conversation with the AI interviewer, answering technical questions specific to your selected role.

### 3. Comprehensive Feedback System
- **Real-time evaluation**: Get immediate feedback on your answers
- **Scoring**: Numerical assessment of your responses
- **Strengths analysis**: Identification of strong points in your answers
- **Improvement areas**: Specific suggestions for enhancing weaker responses
- **Summary dashboard**: Complete overview of your interview performance

### 4. Responsive Design
Optimized for both desktop and mobile devices with adaptive layout and intuitive UI.

### 5. Accessibility Features
- Dark/light mode toggle
- Keyboard shortcuts
- Screen reader friendly components

## Future Enhancements

- User authentication and profile management
- Interview history tracking and progress analytics
- Voice input/output support for hands-free practice
- Custom interview tracks with difficulty levels
- Mock system design and whiteboard interview simulations
- Integration with video recording for presentation skills analysis
- Collaborative interview preparation with peer feedback

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [PrepMate Team] - 2025
