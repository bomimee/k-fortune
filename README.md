# 🔮 K-Fortune - AI-Powered Korean Saju Fortune Telling

A modern web application that combines traditional Korean Saju (Four Pillars of Destiny) fortune-telling with cutting-edge AI technology to provide personalized life insights and guidance.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-4285F4?logo=google&logoColor=white)

## ✨ Features

### 🎯 Three Types of Readings

1. **General Saju Reading** - Comprehensive life analysis covering:
   - Personality traits and innate talents
   - Career and professional guidance
   - Wealth and financial fortune
   - Love and relationships
   - Health and lifestyle recommendations
   - Lucky elements (colors, numbers, directions)

2. **Compatibility Analysis** - Relationship insights including:
   - Energetic attraction and harmony scores
   - Communication patterns and conflict resolution
   - Long-term relationship outlook
   - Customized advice for both partners

3. **Annual Fortune (2026)** - Year-specific guidance with:
   - Month-by-month detailed forecasts
   - Best timing for major decisions
   - Lucky and caution periods
   - Seasonal energy transitions

### 🌟 Key Capabilities

- **AI-Powered Analysis**: Utilizes Google's Gemini 2.0 Flash for deep, personalized insights
- **Global Perspective**: Considers geographical and cultural contexts (birthplace & residence)
- **Flexible Input**: Works with or without exact birth time
- **Multiple Calendar Systems**: Supports Solar, Lunar, and Leap Month calendars
- **Beautiful UI**: Modern, responsive design with smooth animations
- **PDF Export**: Download your reading as a formatted PDF
- **User Authentication**: Secure Firebase Authentication
- **Reading History**: Save and revisit past readings
- **PayPal Integration**: Secure payment processing

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **jsPDF & html2canvas** - PDF generation

### Backend
- **Firebase Functions** - Serverless cloud functions
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User management
- **Firebase Hosting** - Static site hosting
- **Google Vertex AI** - Gemini AI integration

### Payment
- **PayPal SDK** - Payment processing

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Blaze (pay-as-you-go) plan
- Google Cloud project with Vertex AI enabled
- PayPal Business account (for payments)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bomimee/k-fortune.git
   cd k-fortune
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. **Configure Firebase**
   ```bash
   firebase login
   firebase use --add
   ```

4. **Set up environment variables**
   
   Create `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   VITE_PAYPAL_MODE=sandbox
   ```

5. **Enable required Firebase services**
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Cloud Functions
   - Hosting

6. **Enable Vertex AI in Google Cloud**
   - Go to Google Cloud Console
   - Enable Vertex AI API
   - Ensure billing is enabled

## 🏃‍♂️ Running Locally

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the app**
   Open [http://localhost:5173](http://localhost:5173)

3. **Test with mock data**
   - Scroll to the bottom of the homepage
   - Click on any of the test buttons (🧪 테스트 모드)

## 📦 Deployment

### Deploy to Firebase

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy functions and hosting**
   ```bash
   firebase deploy
   ```

3. **Deploy only functions**
   ```bash
   firebase deploy --only functions
   ```

4. **Deploy only hosting**
   ```bash
   firebase deploy --only hosting
   ```

## 🎨 Project Structure

```
k-fortune/
├── functions/              # Firebase Cloud Functions
│   ├── index.js           # Main function logic & AI prompts
│   └── package.json       # Function dependencies
├── src/
│   ├── components/        # React components
│   │   ├── ResultAccordion.jsx
│   │   ├── YearFortuneAccordion.jsx
│   │   └── ...
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Result.jsx
│   │   ├── ReadingForm.jsx
│   │   └── ...
│   ├── context/           # React context
│   │   └── AuthContext.jsx
│   ├── utils/             # Utility functions
│   │   ├── saju.js        # Saju calculation logic
│   │   └── testData.js    # Test data generator
│   ├── firebase.js        # Firebase configuration
│   └── index.css          # Global styles
├── public/                # Static assets
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
└── package.json           # Project dependencies
```

## 🔑 Key Features Explained

### AI Prompt Engineering

The application uses carefully crafted prompts that:
- Request English output for global accessibility
- Consider geographical and cultural contexts
- Provide balanced, non-deterministic advice
- Include safety guidelines to prevent harmful predictions
- Utilize all user-provided parameters (birthplace, residence, focus topics, etc.)

### UI/UX Design

- **Dark Theme**: Modern, mystical aesthetic with vibrant gradients
- **Type-Specific Styling**: Each reading type has unique colors and icons
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion for delightful interactions
- **Content Rendering**: Supports markdown, tables, hashtags, and star ratings

### Security

- Firebase Authentication for user management
- Firestore security rules to protect user data
- Environment variables for sensitive credentials
- PayPal SDK for secure payment processing

## 🧪 Testing

### Test Buttons

The homepage includes three test buttons for quick UI testing:
- **📊 일반 사주 테스트** - General reading with full analysis
- **💑 궁합 분석 테스트** - Compatibility reading for two people
- **📅 연간 운세 테스트** - Annual fortune with monthly breakdown

These buttons use pre-generated test data that matches the AI output format.

## 🌐 Internationalization

While the UI is currently in Korean, the AI analysis is generated in **English** to ensure:
- Global accessibility
- Culturally-aware interpretations
- Professional terminology
- Easy translation to other languages

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

Project Link: [https://github.com/bomimee/k-fortune](https://github.com/bomimee/k-fortune)

## 🙏 Acknowledgments

- Traditional Korean Myeongrihak (命理學) principles
- Google Gemini AI for advanced language understanding
- Firebase for robust backend infrastructure
- React and Vite communities for excellent tools

---

**Note**: This application is for entertainment and self-reflection purposes. It should not be used as a substitute for professional advice in matters of health, finance, or relationships.
