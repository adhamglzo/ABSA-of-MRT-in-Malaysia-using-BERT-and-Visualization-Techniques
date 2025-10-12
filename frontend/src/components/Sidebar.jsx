import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  MapPinned,
  MessageCircleMore,
  Moon, // Import Moon icon for dark mode
  Sun,  // Import Sun icon for light mode
} from 'lucide-react';

import prasaranaLogo from '../assets/rapid_kl.jpg';

// Accept toggleDarkMode and darkMode as props from App.jsx
const Sidebar = ({ toggleDarkMode, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  const menu = [
    { name: 'Home', icon: <Home size={24} />, to: '/' },
    { name: 'Dashboard', icon: <LayoutDashboard size={24} />, to: '/dashboard' },
    { name: 'Station Details', icon: <MapPinned size={24} />, to: '/station-details' },
    { name: 'Submit Review', icon: <MessageCircleMore size={24} />, to: '/submit-review' },
  ];

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      // Apply dark mode classes here
      className="h-screen fixed top-0 left-0 bg-white border-r border-gray-200
                 dark:bg-gray-800 dark:border-gray-700
                 transition-all duration-300 ease-in-out z-50"
      style={{ width: expanded ? '250px' : '80px' }} // Adjust width as needed
    >
      <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
        <img
          src={prasaranaLogo}
          alt="Prasarana Logo"
          // Conditionally apply classes based on 'expanded' state
          className={`object-contain transition-all duration-300 ease-in-out
                     ${expanded ? 'w-full h-full p-2' : 'h-10 w-auto'}`}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.to}
            className={`flex items-center ${expanded ? 'justify-start gap-4 px-4' : 'justify-center'} py-3 my-1 rounded-lg text-base font-medium transition-colors duration-150
                      ${
                        location.pathname === item.to
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200' // Dark mode for active link
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700' // Dark mode for inactive link
                      }`}
          >
            {item.icon}
            {expanded && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Dark Mode Toggle Button */}
      {/* Position this at the bottom or a suitable place in your sidebar */}
      <div className={`absolute bottom-4 w-full px-2 ${expanded ? 'px-4' : 'flex justify-center'}`}>
        <button
          onClick={toggleDarkMode}
          className={`flex items-center gap-4 w-full py-3 my-1 rounded-lg text-base font-medium transition-colors duration-150
                     bg-gray-200 text-gray-700 hover:bg-gray-300
                     dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
                     ${expanded ? 'justify-start px-4' : 'justify-center'}`}
          aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          {expanded && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;