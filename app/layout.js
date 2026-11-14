import './globals.css';

export const metadata = {
  title: 'ExamPilot — AI-Powered Competitive Exam Preparation Platform',
  description: 'Comprehensive test preparation platform for SSC, Banking, Railway, and UPSC examinations with real PYQs, adaptive custom tests, and Gemini AI question generation.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

