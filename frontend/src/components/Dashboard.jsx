import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Import the new dashboard API calls, including getTotalReviewsByStationData
import {
  getOverallSentimentData,
  getAspectSentimentData,
  getStationComparisonData,
  getReviewsOverTimeData,
  getSentimentCountsOverTimeData,
  getTotalReviewsByStationData // New import for total reviews by station
} from '../utils/db'; // Removed .js extension to resolve the import error

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
);

// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// IMPORTANT: Dashboard now accepts 'darkMode' and 'toggleDarkMode' as props
const Dashboard = ({ darkMode, toggleDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for chart data
  const [overallSentiment, setOverallSentiment] = useState(null);
  const [aspectSentiment, setAspectSentiment] = useState(null);
  const [stationComparison, setStationComparison] = useState(null);
  const [reviewsOverTime, setReviewsOverTime] = useState(null);
  const [sentimentCountsOverTime, setSentimentCountsOverTime] = useState(null);
  const [totalReviewsByStation, setTotalReviewsByStation] = useState(null); // New state for total reviews by station

  // State for chart mode toggle for Station Comparison chart
  const [stationChartMode, setStationChartMode] = useState('sentiment'); // 'sentiment' or 'totalReviews'
  // NEW: State for sorting order of total reviews by station: 'default', 'asc', 'desc'
  const [totalReviewsSortMode, setTotalReviewsSortMode] = useState('default');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading to true before fetching
        const [
          overallRes,
          aspectRes,
          stationCompRes,
          reviewsTimeRes,
          sentimentCountsTimeRes,
          totalReviewsStationData // Fetch new data
        ] = await Promise.all([
          getOverallSentimentData(),
          getAspectSentimentData(),
          getStationComparisonData(),
          getReviewsOverTimeData(),
          getSentimentCountsOverTimeData(),
          getTotalReviewsByStationData() // Call new function
        ]);

        setOverallSentiment(overallRes);
        setAspectSentiment(aspectRes);
        setStationComparison(stationCompRes);
        setReviewsOverTime(reviewsTimeRes);
        setSentimentCountsOverTime(sentimentCountsTimeRes);
        setTotalReviewsByStation(totalReviewsStationData); // Set new state

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false); // Set loading to false after fetching (success or error)
      }
    };
    fetchData();
  }, []);

  // Define colors based on the 'darkMode' prop received from App.jsx
  const colors = {
    bodyBg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-gray-800' : 'bg-white',
    textColor: darkMode ? 'text-white' : 'text-gray-900',
    subTextColor: darkMode ? 'text-gray-300' : 'text-gray-600',
    errorBg: darkMode ? 'bg-red-800 border-red-600' : 'bg-red-100 border-red-400',
    errorText: darkMode ? 'text-red-200' : 'text-red-700',
    // Updated button colors for toggle, based on original dark/light mode
    buttonBgPrimary: darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600', // For primary selected button
    buttonBgSecondary: darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400', // For unselected/secondary buttons
    buttonRingOffset: darkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
    chartLegendColor: darkMode ? '#e0e0e0' : '#333',
    chartTitleColor: darkMode ? '#e0e0e0' : '#333',
    chartAxisTitleColor: darkMode ? '#e0e0e0' : '#555',
    chartAxisTicksColor: darkMode ? '#a0a0a0' : '#666',
    chartGridColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    chartTooltipBg: darkMode ? 'rgba(51,51,51,0.8)' : 'rgba(255,255,255,0.8)',
    chartTooltipTextColor: darkMode ? '#e0e0e0' : '#333',
    chartBorderColor: darkMode ? '#1f2937' : '#ddd',
    // Sentiment specific colors
    positiveColor: darkMode ? '#28a745' : '#4CAF50',
    neutralColor: darkMode ? '#ffc107' : '#FFC107',
    negativeColor: darkMode ? '#dc3545' : '#F44336',
  };

  // Helper function to get Chart.js text color (simplified from individual color defs)
  const getChartTextColor = () => (darkMode ? 'white' : 'black');
  const getChartGridColor = () => (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)');

  // Function to toggle sort order
  const handleSortToggle = () => {
    setTotalReviewsSortMode(prevMode => {
      if (prevMode === 'default') {
        return 'asc';
      } else if (prevMode === 'asc') {
        return 'desc';
      } else {
        return 'default';
      }
    });
  };

  // --- Chart Data Preparation Functions ---

  // Chart 1: Overall Sentiment Distribution (Pie Chart)
  const getOverallPieChartData = () => {
    if (!overallSentiment) return { labels: [], datasets: [] };

    const labels = ['Positive', 'Neutral', 'Negative'];
    const data = [
      overallSentiment.Positive,
      overallSentiment.Neutral,
      overallSentiment.Negative
    ];
    const backgroundColors = [colors.positiveColor, colors.neutralColor, colors.negativeColor];

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: colors.chartBorderColor,
          borderWidth: 1,
        },
      ],
    };
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.chartLegendColor,
        },
      },
      title: {
        display: true,
        text: 'Overall Sentiment Distribution',
        font: { size: 16, color: colors.chartTitleColor },
        color: colors.chartTitleColor
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
              label += ` (${percentage})`;
            }
            return label;
          }
        },
        backgroundColor: colors.chartTooltipBg,
        titleColor: colors.chartTooltipTextColor,
        bodyColor: colors.chartTooltipTextColor
      }
    }
  };

  // Chart 2: Sentiment Distribution by Aspect Category (Stacked Bar Chart - as per original)
  const getAspectStackedBarData = () => {
    if (!aspectSentiment) return { labels: [], datasets: [] };

    const labels = aspectSentiment.labels.map(label => capitalizeFirstLetter(label));

    return {
      labels: labels,
      datasets: [
        {
          label: 'Positive',
          data: aspectSentiment.positive,
          backgroundColor: colors.positiveColor,
        },
        {
          label: 'Neutral',
          data: aspectSentiment.neutral,
          backgroundColor: colors.neutralColor,
        },
        {
          label: 'Negative',
          data: aspectSentiment.negative,
          backgroundColor: colors.negativeColor,
        },
      ],
    };
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.chartLegendColor,
        },
      },
      title: {
        display: true,
        text: 'Sentiment Distribution by Aspect Category',
        font: { size: 16, color: colors.chartTitleColor },
        color: colors.chartTitleColor
      },
      tooltip: {
        backgroundColor: colors.chartTooltipBg,
        titleColor: colors.chartTooltipTextColor,
        bodyColor: colors.chartTooltipTextColor
      }
    },
    scales: {
      x: {
        stacked: true, // This should be true as per original design
        title: {
          display: true,
          text: 'Aspect Category',
          color: colors.chartAxisTitleColor
        },
        ticks: {
          color: colors.chartAxisTicksColor
        },
        grid: {
          color: colors.chartGridColor
        }
      },
      y: {
        stacked: true, // This should be true as per original design
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Sentiments',
          color: colors.chartAxisTitleColor
        },
        ticks: {
          color: colors.chartAxisTicksColor
        },
        grid: {
          color: colors.chartGridColor
        }
      },
    },
  };

  // Chart 3: Station Comparison by Overall Sentiment (Grouped Bar Chart - as per original)
  const getStationComparisonBarData = () => {
    if (!stationComparison) return { labels: [], datasets: [] };

    return {
      labels: stationComparison.labels,
      datasets: [
        {
          label: 'Positive',
          data: stationComparison.positive,
          backgroundColor: colors.positiveColor,
        },
        {
          label: 'Neutral',
          data: stationComparison.neutral,
          backgroundColor: colors.neutralColor,
        },
        {
          label: 'Negative',
          data: stationComparison.negative,
          backgroundColor: colors.negativeColor,
        },
      ],
    };
  };

  // NEW: Total Reviews by Station Bar Chart (mimicking original style - non-stacked, single color)
  const getTotalReviewsByStationBarData = () => {
    if (!totalReviewsByStation) return { labels: [], datasets: [] };

    let combinedData = totalReviewsByStation.labels.map((label, index) => ({
      label: label,
      total_reviews: totalReviewsByStation.total_reviews[index]
    }));

    // Apply sorting based on totalReviewsSortMode
    if (totalReviewsSortMode === 'asc') {
      combinedData.sort((a, b) => a.total_reviews - b.total_reviews);
    } else if (totalReviewsSortMode === 'desc') {
      combinedData.sort((a, b) => b.total_reviews - a.total_reviews);
    } else { // 'default' - sort alphabetically by label (station name)
      combinedData.sort((a, b) => a.label.localeCompare(b.label));
    }

    const labels = combinedData.map(item => item.label);
    const data = combinedData.map(item => item.total_reviews);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Total Reviews',
          data: data,
          backgroundColor: darkMode ? '#63b3ed' : '#3B82F6', // A single blue color for all bars
          borderColor: darkMode ? '#60A5FA' : '#3B82F6', // Border color matching the fill
          borderWidth: 1,
        },
      ],
    };
  };


  const stationComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.chartLegendColor,
          // Corrected filter to ensure "Total Reviews" label is shown when applicable
          filter: function(legendItem, chartData) {
            if (stationChartMode === 'totalReviews') {
              // Only show the "Total Reviews" label for its dataset
              return legendItem.text === 'Total Reviews';
            }
            // For sentiment mode, show all sentiment labels
            return ['Positive', 'Neutral', 'Negative'].includes(legendItem.text);
          }
        },
      },
      title: {
        display: true,
        text: stationChartMode === 'sentiment' ? 'Sentiment Comparison by Station' : 'Total Reviews by Station',
        font: { size: 16, color: colors.chartTitleColor },
        color: colors.chartTitleColor
      },
      tooltip: {
        backgroundColor: colors.chartTooltipBg,
        titleColor: colors.chartTooltipTextColor,
        bodyColor: colors.chartTooltipTextColor
      }
    },
    scales: {
      x: {
        // Stacked property is crucial here: false for original sentiment and new total reviews
        stacked: false, // Ensure both sentiment and total reviews are not stacked as per original design
        title: {
          display: true,
          text: 'Station',
          color: colors.chartAxisTitleColor
        },
        ticks: {
          color: colors.chartAxisTicksColor,
          autoSkip: false, // Prevents Chart.js from skipping labels
          maxRotation: 90,   // Allows labels to rotate up to 90 degrees if needed
          minRotation: 45    // Minimum rotation to apply for readability
        },
        grid: {
          color: colors.chartGridColor
        }
      },
      y: {
        // Stacked property is crucial here: false for original sentiment and new total reviews
        stacked: false, // Ensure both sentiment and total reviews are not stacked as per original design
        beginAtZero: true,
        title: {
          display: true,
          text: stationChartMode === 'sentiment' ? 'Number of Sentiments' : 'Total Reviews',
          color: colors.chartAxisTitleColor
        },
        ticks: {
          color: colors.chartAxisTicksColor
        },
        grid: {
          color: colors.chartGridColor
        }
      },
    },
  };


  // Chart 4: Number of Reviews Over Time (Line Chart)
  const getReviewsOverTimeChartData = () => {
    if (!reviewsOverTime) return { labels: [], datasets: [] };

    const labels = Object.keys(reviewsOverTime);
    const data = Object.values(reviewsOverTime);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Number of Reviews',
          data: data,
          borderColor: darkMode ? '#60A5FA' : '#3B82F6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointStyle: 'circle', // Ensure points on the line are circles for consistency if desired
        },
      ],
    };
  };

  const reviewsOverTimeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.chartLegendColor,
          usePointStyle: true, // Use the point style defined in the dataset
          pointStyle: 'rect', // Explicitly set legend marker to square (rectangle)
        },
      },
      title: {
        display: true,
        text: 'Number of Reviews Over Time',
        font: { size: 16, color: colors.chartTitleColor },
        color: colors.chartTitleColor
      },
      tooltip: {
        backgroundColor: colors.chartTooltipBg,
        titleColor: colors.chartTooltipTextColor,
        bodyColor: colors.chartTooltipTextColor
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year', // Changed from 'Month-Year' to 'Year'
          color: colors.chartAxisTitleColor
        },
        ticks: {
          color: colors.chartAxisTicksColor
        },
        grid: {
          color: colors.chartGridColor
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Reviews',
          color: colors.chartAxisTitleColor
        },
        ticks: {
          color: colors.chartAxisTicksColor
        },
        grid: {
          color: colors.chartGridColor
        }
      },
    },
  };

  // UPDATED CHART 5: Sentiment Counts Over Time (NOW LINE CHART)
  const getSentimentCountsOverTimeChartData = () => {
    if (!sentimentCountsOverTime) return { labels: [], datasets: [] };

    const months = Object.keys(sentimentCountsOverTime).sort();
    const positiveData = months.map(month => sentimentCountsOverTime[month]?.positive || 0);
    const neutralData = months.map(month => sentimentCountsOverTime[month]?.neutral || 0);
    const negativeData = months.map(month => sentimentCountsOverTime[month]?.negative || 0);

    return {
      labels: months,
      datasets: [
        {
          label: 'Positive',
          data: positiveData,
          borderColor: colors.positiveColor,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          pointStyle: 'rect', // Set point style to rectangle for positive sentiment
        },
        {
          label: 'Neutral',
          data: neutralData,
          borderColor: colors.neutralColor,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          pointStyle: 'triangle', // Example: triangle for neutral, or 'rect' for square
        },
        {
          label: 'Negative',
          data: negativeData,
          borderColor: colors.negativeColor,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          pointStyle: 'star', // Example: star for negative, or 'rect' for square
        },
      ],
    };
  };

  const sentimentCountsOverTimeLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.chartLegendColor,
          usePointStyle: true, // Use point style from datasets for legend markers
        },
      },
      title: {
        display: true,
        text: 'Sentiment Counts Over Time',
        font: { size: 16, color: colors.chartTitleColor },
        color: colors.chartTitleColor
      },
      tooltip: {
        backgroundColor: colors.chartTooltipBg,
        titleColor: colors.chartTooltipTextColor,
        bodyColor: colors.chartTooltipTextColor
      }
    },
    scales: {
      x: {
        stacked: false, // This should be false as per original design
        title: {
          display: true,
          text: 'Month-Year',
          color: colors.chartAxisTitleColor
        },
        ticks: {
          color: colors.chartAxisTicksColor
        },
        grid: {
          color: colors.chartGridColor
        }
      },
      y: {
        stacked: false, // This should be false as per original design
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Sentiments',
          color: colors.chartAxisTitleColor
        },
        ticks: {
          color: colors.chartAxisTicksColor
        },
        grid: {
          color: colors.chartGridColor
        }
      },
    },
  };


  if (loading) {
    return (
      <div className={`min-h-screen ${colors.bodyBg} py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className={`mt-4 ${colors.subTextColor}`}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${colors.bodyBg} py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center`}>
        <div className={`max-w-md mx-auto p-6 ${colors.errorBg} ${colors.errorText} rounded-md shadow-md text-center`}>
          <p className="font-semibold mb-2">Error:</p>
          <p>{error}</p>
          <Link to="/" className={`mt-4 inline-block ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>Go Back Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.bodyBg} py-8 px-4 sm:px-6 lg:px-8`}>
      {/* Back Button and Theme Toggle */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        {/* Back Button (Left side) */}
        <Link
          to="/"
          className={`inline-flex items-center px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-gray-800'} text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${colors.buttonRingOffset}`}
        >
          ← Back
        </Link>

        {/* Dark Mode Toggle Button (Right side) */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'focus:ring-gray-500 focus:ring-offset-gray-900' : 'focus:ring-blue-500 focus:ring-offset-white'}`}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.325 3.325l-.707.707M6.379 6.379l-.707-.707m12.728 0l-.707.707M6.379 17.621l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto text-center mb-8">
        <h1 className={`text-3xl font-bold ${colors.textColor}`}>📊 Sentiment Analysis Dashboard</h1>
        <p className={`mt-2 ${colors.subTextColor}`}>
          Overview of sentiments across stations and aspects.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chart 1: Overall Sentiment Distribution */}
        <div className={`${colors.cardBg} rounded-lg shadow p-6 h-96`}>
          {overallSentiment && <Pie data={getOverallPieChartData()} options={pieChartOptions} />}
          {overallSentiment && overallSentiment.Positive === 0 && overallSentiment.Negative === 0 && overallSentiment.Neutral === 0 && (
            <p className={`text-center ${colors.subTextColor} mt-4`}>No overall sentiment data available.</p>
          )}
        </div>

        {/* Chart 2: Sentiment Distribution by Aspect Category */}
        <div className={`${colors.cardBg} rounded-lg shadow p-6 h-96`}>
          {aspectSentiment && <Bar data={getAspectStackedBarData()} options={stackedBarOptions} />}
          {aspectSentiment && aspectSentiment.positive.every(count => count === 0) &&
            aspectSentiment.neutral.every(count => count === 0) &&
            aspectSentiment.negative.every(count => count === 0) && (
            <p className={`text-center ${colors.subTextColor} mt-4`}>No aspect sentiment data available.</p>
          )}
        </div>

        {/* Chart 3: Station Comparison / Total Reviews by Station (spans 2 columns on medium screens) */}
        <div className={`${colors.cardBg} rounded-lg shadow p-6 md:col-span-2 h-96 w-full flex flex-col`}>
          {/* Toggle Button and Sort Buttons */}
          {/* Adjusted positioning of sort and main toggle buttons */}
          <div className="flex justify-end items-center mb-4">
            {stationChartMode === 'totalReviews' && (
              <div className="flex space-x-2 mr-3"> {/* Added mr-3 for spacing */}
                <button
                  onClick={handleSortToggle}
                  className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${colors.textColor} focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-blue-500 focus:ring-offset-gray-800' : 'focus:ring-blue-400 focus:ring-offset-white'}`}
                  aria-label={
                    totalReviewsSortMode === 'default'
                      ? "Sort by count ascending"
                      : totalReviewsSortMode === 'asc'
                      ? "Sort by count descending"
                      : "Sort by default order (station name/ID)"
                  }
                >
                  {totalReviewsSortMode === 'default' && (
                    // Default sort icon (e.g., list icon or general sort)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="6" x2="15" y2="6"></line>
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="18" x2="15" y2="18"></line>
                    </svg>
                  )}
                  {totalReviewsSortMode === 'asc' && (
                    // Down arrow for descending
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 5.414V14a1 1 0 11-2 0V5.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" clipRule="evenodd" />
                    </svg>
                  )}
                  {totalReviewsSortMode === 'desc' && (
                    
                    // Up arrow for ascending
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 17a1 1 0 01-.707-.293l-3-3a1 1 0 011.414-1.414L9 14.586V6a1 1 0 112 0v8.586l1.293-1.293a1 1 0 011.414 1.414l-3 3A1 1 0 0110 17z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            )}
            {/* Main Chart Toggle Button */}
            <button
              onClick={() => setStationChartMode(stationChartMode === 'sentiment' ? 'totalReviews' : 'sentiment')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
                         ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white shadow-lg' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'}
                         focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-blue-500 focus:ring-offset-gray-800' : 'focus:ring-blue-400 focus:ring-offset-white'}`}
            >
              {stationChartMode === 'sentiment' ? 'View Total Reviews' : 'View Sentiment Comparison'}
            </button>
          </div>
          <div className="flex-grow"> {/* This div ensures the chart takes available height */}
            {stationChartMode === 'sentiment' && stationComparison && (
              <Bar data={getStationComparisonBarData()} options={stationComparisonOptions} />
            )}
            {stationChartMode === 'totalReviews' && totalReviewsByStation && (
              <Bar data={getTotalReviewsByStationBarData()} options={stationComparisonOptions} />
            )}
            {((stationChartMode === 'sentiment' && stationComparison && stationComparison.labels.length === 0) ||
              (stationChartMode === 'totalReviews' && totalReviewsByStation && totalReviewsByStation.labels.length === 0)) && (
              <p className={`text-center ${colors.subTextColor} mt-4`}>No data available for this chart.</p>
            )}
          </div>
        </div>

        {/* Chart 4: Number of Reviews Over Time (Line Chart) */}
        <div className={`${colors.cardBg} rounded-lg shadow p-6 h-96`}>
          {reviewsOverTime && <Line data={getReviewsOverTimeChartData()} options={reviewsOverTimeOptions} />}
          {reviewsOverTime && Object.keys(reviewsOverTime).length === 0 && (
            <p className={`text-center ${colors.subTextColor} mt-4`}>No review activity data available over time.</p>
          )}
        </div>

        {/* UPDATED CHART: Sentiment Counts Over Time (NOW LINE CHART) */}
        <div className={`${colors.cardBg} rounded-lg shadow p-6 h-96`}>
          {sentimentCountsOverTime && <Line data={getSentimentCountsOverTimeChartData()} options={sentimentCountsOverTimeLineOptions} />}
          {sentimentCountsOverTime && Object.keys(sentimentCountsOverTime).length === 0 && (
            <p className={`text-center ${colors.subTextColor} mt-4`}>No sentiment count data available over time.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
