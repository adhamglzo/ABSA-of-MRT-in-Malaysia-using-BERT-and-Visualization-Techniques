// frontend/src/components/StationDetails.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { getAllStations, getTotalReviewsAllStations, getOverallSentimentAnalysis, getStationSentimentAnalysis } from '../utils/db'; // Import new function
import VerticalStationSelector from "./VerticalStationSelector";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const StationDetails = () => {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('all_stations'); // Default to 'all_stations'
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [overallStationTotal, setOverallStationTotal] = useState(0); // Total reviews for a specific station OR all stations
  const [allStationsTotalReviews, setAllStationsTotalReviews] = useState(null); // Total reviews across all stations (for initial display)


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stationsData, totalReviewsData] = await Promise.all([
          getAllStations(),
          getTotalReviewsAllStations() // Fetch the global total
        ]);
        console.log('Fetched stations:', stationsData);
        setStations(stationsData);
        setAllStationsTotalReviews(totalReviewsData); // Set the global total
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setErrorMessage('Failed to load initial data (stations or total reviews).');
      }
    };
    fetchData();
  }, []);

  // Effect to fetch sentiment data when selectedStationId changes
  useEffect(() => {
    const loadSentiment = async () => {
      setLoading(true);
      setErrorMessage('');
      setSentimentData(null);
      setOverallStationTotal(0);

      try {
        let data;
        if (selectedStationId === 'all_stations') {
          data = await getOverallSentimentAnalysis(); // Call new function for overall data
        } else if (selectedStationId) {
          data = await getStationSentimentAnalysis(selectedStationId); // Call existing function for single station
        } else {
            // No station selected (shouldn't happen with 'all_stations' default, but as a fallback)
            setLoading(false);
            return;
        }

        console.log('Fetched sentiment data:', data);

        if (data.error) {
          setErrorMessage(data.error);
          setSentimentData(null);
          setOverallStationTotal(0);
        } else {
          setSentimentData(data.aspect_data);
          setOverallStationTotal(data.overall_total_reviews);
        }
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        setErrorMessage(`Error fetching sentiment data: ${error.message}. Please try again.`);
        setSentimentData(null);
        setOverallStationTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadSentiment();
  }, [selectedStationId]); // Dependency array includes selectedStationId

  const aspects = [
    { id: 'cleanliness', label: 'Cleanliness' },
    { id: 'comfort', label: 'Comfort' },
    { id: 'safety', 'label': 'Safety' },
    { id: 'service', label: 'Service' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'other/uncategorized', label: 'Other/Uncategorized' }
  ];

  const getChartData = (aspectId) => {
    if (!sentimentData || !sentimentData[aspectId]) {
      return {
        labels: [],
        datasets: []
      };
    }

    const aspectSentiments = sentimentData[aspectId];
    const data = [
      aspectSentiments.Positive || 0,
      aspectSentiments.Neutral || 0,
      aspectSentiments.Negative || 0,
    ];

    const labels = ['Positive', 'Neutral', 'Negative'];
    const backgroundColors = ['#4CAF50', '#FFC107', '#F44336'];

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  };

  const getChartOptions = () => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(156 163 175)'
        }
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
            }
            return label;
          }
        }
      }
    }
  });


  // Calculate overall sentiment totals for the currently selected view (station or all stations)
  let calculatedTotalPositiveForDisplay = 0;
  let calculatedTotalNeutralForDisplay = 0;
  let calculatedTotalNegativeForDisplay = 0;

  if (sentimentData) {
    Object.values(sentimentData).forEach(aspect => {
      calculatedTotalPositiveForDisplay += aspect.Positive || 0;
      calculatedTotalNeutralForDisplay += aspect.Neutral || 0;
      calculatedTotalNegativeForDisplay += aspect.Negative || 0;
    });
  }

  // Calculate percentages for these overall totals
  const overallPositivePercentage = overallStationTotal > 0 ? ((calculatedTotalPositiveForDisplay / overallStationTotal) * 100).toFixed(1) : '0.0';
  const overallNeutralPercentage = overallStationTotal > 0 ? ((calculatedTotalNeutralForDisplay / overallStationTotal) * 100).toFixed(1) : '0.0';
  const overallNegativePercentage = overallStationTotal > 0 ? ((calculatedTotalNegativeForDisplay / overallStationTotal) * 100).toFixed(1) : '0.0';

  const isDarkMode = document.documentElement.classList.contains('dark');
  const colors = {
    buttonBgSecondary: isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 dark:bg-gray-900 dark:text-gray-200 transition-colors duration-300">
      {/* Container for Back Button and Total Reviews - KEPT AT THE TOP */}
      <div className="max-w-7xl mx-auto mb-8 relative flex justify-between items-center">
        <Link
          to="/"
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${colors.buttonBgSecondary} text-white`}
        >
          ← Back
        </Link>
        {/* Conditional Display for total reviews section */}
        {(selectedStationId === 'all_stations' && allStationsTotalReviews !== null) || (selectedStationId !== 'all_stations' && overallStationTotal > 0) ? (
          <div className="flex flex-col items-end text-right min-w-[200px]">
              <div className="flex justify-between w-full text-gray-800 text-lg font-semibold mb-1 dark:text-gray-200">
                  <span>Total Reviews:</span>
                  <span>{overallStationTotal}</span>
              </div>
              {overallStationTotal > 0 && (
                  <div className="text-base font-semibold space-y-0.5 w-full">
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Positive:</span>
                          <span>{calculatedTotalPositiveForDisplay} <span className="font-normal opacity-80">({overallPositivePercentage}%)</span></span>
                      </div>
                      <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                          <span>Neutral:</span>
                          <span>{calculatedTotalNeutralForDisplay} <span className="font-normal opacity-80">({overallNeutralPercentage}%)</span></span>
                      </div>
                      <div className="flex justify-between text-red-600 dark:text-red-400">
                          <span>Negative:</span>
                          <span>{calculatedTotalNegativeForDisplay} <span className="font-normal opacity-80">({overallNegativePercentage}%)</span></span>
                      </div>
                  </div>
              )}
          </div>
        ) : null }
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT PANEL: Station Selector */}
          <div className="lg:w-1/4 p-4 bg-white rounded-lg shadow dark:bg-gray-800 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Select a Station</h3>
            <VerticalStationSelector
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
          </div>

          {/* RIGHT PANEL: Main Content Area (Station Details Title + Sentiment Analysis) */}
          <div className="lg:w-3/4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedStationId === 'all_stations' ? 'Overall Sentiment Analysis' : 'Station Details'} {/* Dynamic Title */}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {selectedStationId === 'all_stations' ? 'Aggregated sentiment analysis across all stations' : 'Select a station to view sentiment analysis'} {/* Dynamic Subtitle */}
              </p>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
                <div className="max-w-xl mx-auto mb-4 p-4 text-red-700 bg-red-100 border border-red-400 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-600">
                    {errorMessage}
                </div>
            )}

            {/* Sentiment Analysis Display */}
            {loading ? (
              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4">Loading sentiment data...</p>
              </div>
            ) : sentimentData && Object.keys(sentimentData).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {aspects.map((aspect) => {
                  const dataForChart = getChartData(aspect.id);
                  const totalSentiments = dataForChart.datasets[0].data.reduce((sum, val) => sum + val, 0);

                  const positiveCount = sentimentData[aspect.id]?.Positive || 0;
                  const neutralCount = sentimentData[aspect.id]?.Neutral || 0;
                  const negativeCount = sentimentData[aspect.id]?.Negative || 0;

                  const positivePercentage = totalSentiments > 0 ? ((positiveCount / totalSentiments) * 100).toFixed(1) : '0.0';
                  const neutralPercentage = totalSentiments > 0 ? ((neutralCount / totalSentiments) * 100).toFixed(1) : '0.0';
                  const negativePercentage = totalSentiments > 0 ? ((negativeCount / totalSentiments) * 100).toFixed(1) : '0.0';

                  return (
                    <div key={aspect.id} className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">{aspect.label}</h3>
                      <div className="mb-4">
                        {totalSentiments > 0 ? (
                            <Pie data={dataForChart} options={getChartOptions()} />
                        ) : (
                            <div className="text-center text-gray-500 py-10 dark:text-gray-400">No sentiment data for this aspect.</div>
                        )}
                      </div>
                      <div className="space-y-2 text-sm dark:text-gray-200">
                        <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                          <span>Positive:</span>
                          <span className="font-medium">
                              {positiveCount} <span className="font-normal opacity-80">({positivePercentage}%)</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-yellow-600 dark:text-yellow-400">
                          <span>Neutral:</span>
                          <span className="font-medium">
                              {neutralCount} <span className="font-normal opacity-80">({neutralPercentage}%)</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                          <span>Negative:</span>
                          <span className="font-medium">
                              {negativeCount} <span className="font-normal opacity-80">({negativePercentage}%)</span>
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between items-center text-gray-800 font-bold dark:border-gray-600 dark:text-gray-200">
                            <span>Total:</span>
                            <span>{totalSentiments}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                {!selectedStationId && <p>Please select a station to view its sentiment details.</p>}
                {selectedStationId === 'all_stations' && !loading && <p>No overall sentiment data available.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationDetails;