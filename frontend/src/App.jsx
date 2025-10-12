// App.jsx (Only the relevant Route line needs changing)
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import StationDetails from './components/StationDetails';
import SubmitReview from './components/SubmitReview'; // Ensure this import is present
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';

function App() {
  // Initialize dark mode based on user preference or localStorage
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Effect to apply/remove the 'dark' class to the html element
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (darkMode) {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <Router>
      <Sidebar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
      <div className="ml-[64px] md:ml-[150px] transition-all">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route path="/station-details" element={<StationDetails />} />
          {/* NEW: Pass the darkMode prop to SubmitReview */}
          <Route path="/submit-review" element={<SubmitReview darkMode={darkMode} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;