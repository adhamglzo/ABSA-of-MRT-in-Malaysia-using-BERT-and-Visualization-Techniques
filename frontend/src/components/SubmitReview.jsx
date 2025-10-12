// frontend/src/components/SubmitReview.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllStations, submitReview, analyzeReviewPreview } from '../utils/db';
import { PlusCircle } from 'lucide-react'; // Import a modern add icon

// Accept darkMode as a prop
const SubmitReview = ({ darkMode }) => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [review, setReview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // Used for both analyze and submit
  const [submitStatus, setSubmitStatus] = useState(null);
  const [analyzedResults, setAnalyzedResults] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false); // New state to control analysis display

  // --- NEW STATES FOR EDITING AND MANUAL ADDING ASPECTS ---
  const [editingAspectIndex, setEditingAspectIndex] = useState(null); // Index of the aspect being edited
  const [currentEditedCategory, setCurrentEditedCategory] = useState(''); // Temp state for edited category
  const [currentEditedPolarity, setCurrentEditedPolarity] = useState(''); // Temp state for edited polarity
  const [showManualAddForm, setShowManualAddForm] = useState(false); // NEW STATE: To control manual add form display

  // Predefined list of aspect categories (should match your backend's target_aspects)
  const aspectCategories = [
    'cleanliness', 'comfort', 'safety', 'service', 'facilities', 'other/uncategorized'
  ];
  // Predefined list of sentiment polarities
  const sentimentPolarities = ['Positive', 'Neutral', 'Negative'];

  // Define colors based on the darkMode prop
  const colors = {
    bodyBg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-gray-800' : 'bg-white',
    textColor: darkMode ? 'text-white' : 'text-gray-900',
    subTextColor: darkMode ? 'text-gray-300' : 'text-gray-600',
    inputBg: darkMode ? 'bg-gray-700' : 'bg-white',
    inputBorder: darkMode ? 'border-gray-600' : 'border-gray-300',
    inputText: darkMode ? 'text-white' : 'text-gray-900',
    placeholderColor: darkMode ? 'placeholder-gray-400' : 'placeholder-gray-500',
    disabledBg: darkMode ? 'disabled:bg-gray-600' : 'disabled:bg-gray-100',
    disabledText: darkMode ? 'disabled:text-gray-400' : 'disabled:text-gray-900',
    focusRing: darkMode ? 'focus:ring-blue-400 focus:border-blue-400' : 'focus:ring-blue-500 focus:border-blue-500',
    buttonBgPrimary: darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700',
    buttonBgSuccess: darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700',
    buttonBgSecondary: darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-gray-800',
    buttonDisabled: darkMode ? 'disabled:bg-gray-600 disabled:cursor-not-allowed' : 'disabled:bg-gray-400 disabled:cursor-not-allowed',
    analysisBoxBg: darkMode ? 'bg-blue-900' : 'bg-blue-50',
    analysisBoxText: darkMode ? 'text-blue-200' : 'text-blue-900',
    analysisItemBorder: darkMode ? 'border-gray-700' : 'border-gray-200',
    sentimentPositive: darkMode ? 'text-green-400' : 'text-green-600',
    sentimentNeutral: darkMode ? 'text-yellow-400' : 'text-yellow-600',
    sentimentNegative: darkMode ? 'text-red-400' : 'text-red-600',
    statusSuccessBg: darkMode ? 'bg-green-900' : 'bg-green-50',
    statusSuccessText: darkMode ? 'text-green-200' : 'text-green-800',
    statusInfoBg: darkMode ? 'bg-blue-900' : 'bg-blue-50',
    statusInfoText: darkMode ? 'text-blue-200' : 'text-blue-800',
    statusErrorBg: darkMode ? 'bg-red-900' : 'bg-red-50',
    statusErrorText: darkMode ? 'text-red-200' : 'text-red-800',
    editButton: darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-500 hover:text-blue-700',
    removeButton: darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700',
    editSaveButton: darkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600',
    editCancelButton: darkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-300 text-gray-800 hover:bg-gray-400',
  };


  useEffect(() => {
    const fetchStations = async () => {
      try {
        const stationsData = await getAllStations();
        console.log('Fetched stations:', stationsData);
        setStations(stationsData);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };
    fetchStations();
  }, []);

  // Helper function to get sentiment color based on current theme
  const getSentimentColor = (polarity) => {
    switch (polarity.toLowerCase()) {
      case 'positive': return colors.sentimentPositive;
      case 'negative': return colors.sentimentNegative;
      case 'neutral': return colors.sentimentNeutral;
      default: return colors.subTextColor; // Default or uncategorized
    }
  };

  const handleAnalyzeReview = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    setAnalyzedResults([]);
    setShowAnalysis(false);
    setEditingAspectIndex(null); // Reset editing state on new analysis
    setShowManualAddForm(false); // NEW: Hide manual add form on new analysis

    if (!selectedStation || !review.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please select a station and enter your review.' });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await analyzeReviewPreview(review);

      if (response.analyzed_aspects && response.analyzed_aspects.length > 0) {
        // --- START NEW LOGIC FOR DEDUPLICATING 'OTHER/UNCATEGORIZED' ---
        const processedAspects = [];
        let hasOtherUncategorized = false;

        response.analyzed_aspects.forEach(aspect => {
          if (aspect.category === 'other/uncategorized') {
            if (!hasOtherUncategorized) {
              processedAspects.push(aspect);
              hasOtherUncategorized = true;
            }
            // If hasOtherUncategorized is true, we skip adding this 'other/uncategorized' aspect
          } else {
            processedAspects.push(aspect);
          }
        });
        // --- END NEW LOGIC ---

        setAnalyzedResults(processedAspects); // Set processed aspects
        setSubmitStatus({ type: 'success', message: 'Analysis ready. Please review before submitting.' });
        setShowAnalysis(true);
      } else {
        // If no specific aspects identified, prompt user to add one manually
        setSubmitStatus({ type: 'info', message: 'No specific aspects identified. You can add one manually or proceed to submit.' });
        setAnalyzedResults([]); // Ensure analyzedResults is empty
        setShowAnalysis(true);
        // Initialize dropdowns for manual input if no aspects were found
        setCurrentEditedCategory(aspectCategories[0]);
        setCurrentEditedPolarity(sentimentPolarities[0]);
      }
    } catch (error) {
      console.error('Error analyzing review:', error);
      setSubmitStatus({ type: 'error', message: `Failed to analyze review: ${error.message}. Please try again.` });
      setShowAnalysis(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setSubmitStatus(null);
    setIsProcessing(true);
    setEditingAspectIndex(null); // Ensure no aspect is in edit mode when submitting
    setShowManualAddForm(false); // NEW: Hide manual add form on submit

    try {
      const response = await submitReview(selectedStation, review, analyzedResults); // Pass analyzedResults

      setSubmitStatus({ type: 'success', message: 'Review submitted successfully!' });
      setReview('');
      setSelectedStation('');
      setAnalyzedResults([]);
      setShowAnalysis(false);
    } catch (error) {
      console.error('Error confirming and submitting review:', error);
      setSubmitStatus({ type: 'error', message: `Failed to submit review: ${error.message}. Please try again.` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAspect = (indexToRemove) => {
    setAnalyzedResults(currentResults => {
      const updated = currentResults.filter((_, index) => index !== indexToRemove);
      if (updated.length === 0 && showAnalysis) { // If all removed and analysis section is visible
          setSubmitStatus({ type: 'info', message: 'All specific aspects removed. Please add one manually or submit as general.' });
          setCurrentEditedCategory(aspectCategories[0]); // Reset dropdowns for new manual input
          setCurrentEditedPolarity(sentimentPolarities[0]);
          setShowManualAddForm(true); // NEW: Show manual add form if all aspects are removed
      }
      return updated;
    });
  };

  // --- FUNCTION TO ADD MANUAL ASPECT ---
  const handleAddManualAspect = () => {
    if (!currentEditedCategory || !currentEditedPolarity) {
        setSubmitStatus({ type: 'error', message: 'Please select both a category and polarity for the manual aspect.' });
        return;
    }

    // Add logic here to prevent adding duplicate 'other/uncategorized' manually
    const existingOtherUncategorized = analyzedResults.some(
      (aspect) => aspect.category === 'other/uncategorized'
    );

    if (currentEditedCategory === 'other/uncategorized' && existingOtherUncategorized) {
      setSubmitStatus({ type: 'info', message: 'An "Other/Uncategorized" aspect already exists. Only one is allowed.' });
      setShowManualAddForm(false); // Hide the form after notifying
      return;
    }


    setAnalyzedResults(prevResults => [
      { category: currentEditedCategory, polarity: currentEditedPolarity },
      ...prevResults, // Add new aspect to the top
    ]);
    setSubmitStatus({ type: 'success', message: 'Manual aspect added successfully. Review the list before submitting.' });
    // Reset dropdowns for potential further manual additions
    setCurrentEditedCategory(aspectCategories[0]);
    setCurrentEditedPolarity(sentimentPolarities[0]);
    setShowManualAddForm(false); // NEW: Hide the manual add form after adding
  };

  // --- EDITING HANDLERS ---
  const handleEditClick = (index) => {
    setEditingAspectIndex(index);
    setCurrentEditedCategory(analyzedResults[index].category);
    setCurrentEditedPolarity(analyzedResults[index].polarity);
    setShowManualAddForm(false); // NEW: Hide manual add form when editing an existing aspect
  };

  const handleSaveEdit = () => {
    const updatedResults = [...analyzedResults];

    // Check if the edited aspect is being changed to 'other/uncategorized'
    // and if another 'other/uncategorized' already exists (excluding itself)
    if (currentEditedCategory === 'other/uncategorized') {
      const hasOtherUncategorized = updatedResults.some((aspect, idx) =>
        aspect.category === 'other/uncategorized' && idx !== editingAspectIndex
      );
      if (hasOtherUncategorized) {
        setSubmitStatus({ type: 'error', message: 'Cannot change to "Other/Uncategorized" as one already exists.' });
        return; // Prevent saving this change
      }
    }

    updatedResults[editingAspectIndex] = {
      ...updatedResults[editingAspectIndex],
      category: currentEditedCategory,
      polarity: currentEditedPolarity,
    };
    setAnalyzedResults(updatedResults);
    setEditingAspectIndex(null); // Exit edit mode
    setCurrentEditedCategory('');
    setCurrentEditedPolarity('');
  };

  const handleCancelEdit = () => {
    setEditingAspectIndex(null); // Exit edit mode
    setCurrentEditedCategory('');
    setCurrentEditedPolarity('');
  };


  const handleReviewChange = (e) => {
    setReview(e.target.value);
    setSubmitStatus(null);
    setAnalyzedResults([]);
    setShowAnalysis(false);
    setEditingAspectIndex(null); // Reset editing state on review change
    setShowManualAddForm(false); // NEW: Hide manual add form on review change
  };

  const handleStationChange = (e) => {
    setSelectedStation(e.target.value);
    setSubmitStatus(null);
    setAnalyzedResults([]);
    setShowAnalysis(false);
    setEditingAspectIndex(null); // Reset editing state on station change
    setShowManualAddForm(false); // NEW: Hide manual add form on station change
  };


  return (
    <div className={`min-h-screen ${colors.bodyBg} py-8 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-start items-center">
          <Link
            to="/"
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${colors.buttonBgSecondary} text-white`}
          >
            ← Back
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${colors.textColor}`}>Submit Review</h1>
          <p className={`mt-2 ${colors.subTextColor}`}>Share your experience with MRT stations</p>
        </div>

        <form onSubmit={handleAnalyzeReview} className={`${colors.cardBg} shadow rounded-lg p-6`}>
          <div className="mb-6">
            <label className={`block text-sm font-medium ${colors.subTextColor} mb-2`}>Select Station</label>
            <div className="relative"> {/* Wrapper for custom arrow */}
              <select
                value={selectedStation}
                onChange={handleStationChange}
                className={`w-full px-4 py-2 border rounded-full shadow-sm ${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.focusRing} appearance-none pr-8 transition duration-150 ease-in-out`}
                required
              >
                <option value="" className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'}>Select a station</option>
                {stations.map((station) => (
                  <option key={station.station_id} value={station.station_id} className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'}>
                    {station.station_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium ${colors.subTextColor} mb-2`}>Your Review</label>
            <textarea
              value={review}
              onChange={handleReviewChange}
              disabled={!selectedStation || isProcessing}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm ${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.placeholderColor} ${colors.focusRing} ${colors.disabledBg} disabled:cursor-not-allowed`}
              rows="4"
              placeholder={selectedStation ? 'Write your review here...' : 'Please select a station first'}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!selectedStation || !review.trim() || isProcessing}
            className={`w-full text-white py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${colors.buttonBgPrimary} ${colors.buttonDisabled} ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
          >
            {isProcessing && !showAnalysis ? 'Analyzing...' : 'Analyze Review'}
          </button>

          {submitStatus && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                submitStatus.type === 'success'
                  ? `${colors.statusSuccessBg} ${colors.statusSuccessText}`
                  : submitStatus.type === 'info'
                  ? `${colors.statusInfoBg} ${colors.statusInfoText}`
                  : `${colors.statusErrorBg} ${colors.statusErrorText}`
              }`}
            >
              {submitStatus.message}
            </div>
          )}

          {showAnalysis && (
            <div className={`mt-6 p-6 rounded-lg shadow-inner ${colors.analysisBoxBg}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${colors.analysisBoxText}`}>Analyzed Aspects:</h3>
                    {/* Add Aspect Button - now toggles manual add form */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowManualAddForm(prev => !prev); // Toggle visibility
                            setEditingAspectIndex(null); // Ensure no edit is active when adding manually
                            // Reset manual input fields if showing the form
                            if (!showManualAddForm) {
                                setCurrentEditedCategory(aspectCategories[0]);
                                setCurrentEditedPolarity(sentimentPolarities[0]);
                            }
                        }}
                        className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                   ${darkMode ? 'text-blue-200 hover:text-blue-100 focus:ring-offset-gray-800' : 'text-blue-800 hover:text-blue-900 focus:ring-offset-white'}
                                   bg-transparent border-none`}
                        aria-label="Add Manual Aspect"
                    >
                        <PlusCircle size={24} /> {/* Modern add icon */}
                    </button>
                </div>

                {/* Manual Aspect Input Section (conditionally rendered by showManualAddForm) */}
                {showManualAddForm && (
                    <div className={`mt-4 p-4 border rounded-lg ${colors.cardBg} ${colors.inputBorder}`}>
                        <h4 className={`text-md font-medium mb-3 ${colors.textColor}`}>Manually Add an Aspect:</h4>
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row items-center w-full space-y-2 sm:space-y-0 sm:space-x-4">
                                <label htmlFor="manualCategory" className={`sm:w-1/4 text-sm font-medium ${colors.subTextColor}`}>Category:</label>
                                <div className="relative flex-grow">
                                    <select
                                        id="manualCategory"
                                        value={currentEditedCategory}
                                        onChange={(e) => setCurrentEditedCategory(e.target.value)}
                                        className={`appearance-none block w-full px-3 py-2 border rounded-full shadow-sm text-sm ${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.focusRing} pr-8 transition duration-150 ease-in-out`}
                                    >
                                        {aspectCategories.map(cat => (
                                            <option key={cat} value={cat} className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center w-full space-y-2 sm:space-y-0 sm:space-x-4">
                                <label htmlFor="manualPolarity" className={`sm:w-1/4 text-sm font-medium ${colors.subTextColor}`}>Polarity:</label>
                                <div className="relative flex-grow">
                                    <select
                                        id="manualPolarity"
                                        value={currentEditedPolarity}
                                        onChange={(e) => setCurrentEditedPolarity(e.target.value)}
                                        className={`appearance-none block w-full px-3 py-2 border rounded-full shadow-sm text-sm ${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.focusRing} pr-8 transition duration-150 ease-in-out`}
                                    >
                                        {sentimentPolarities.map(pol => (
                                            <option key={pol} value={pol} className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'}>
                                                {pol}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={handleAddManualAspect}
                                    className={`px-4 py-2 text-white text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${colors.buttonBgPrimary} ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
                                >
                                    Add This Aspect
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {analyzedResults.length > 0 ? (
                    <div className="space-y-3 mt-4"> {/* Added mt-4 for spacing */}
                        {analyzedResults.map((result, index) => (
                            <div key={index} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center py-1 border-b ${colors.analysisItemBorder} last:border-b-0`}>

                                {editingAspectIndex === index ? (
                                    <div className="flex flex-col sm:flex-row items-center w-full space-y-2 sm:space-y-0 sm:space-x-4">
                                        <label className={`sm:w-1/4 text-sm font-medium ${colors.subTextColor}`}>Category:</label>
                                        <div className="relative flex-grow">
                                            <select
                                                value={currentEditedCategory}
                                                onChange={(e) => setCurrentEditedCategory(e.target.value)}
                                                className={`appearance-none block w-full px-3 py-2 border rounded-full shadow-sm text-sm ${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.focusRing} pr-8 transition duration-150 ease-in-out`}
                                            >
                                                {aspectCategories.map(cat => (
                                                    <option key={cat} value={cat} className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'}>
                                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                            </div>
                                        </div>

                                        <label className={`sm:w-1/4 text-sm font-medium ${colors.subTextColor}`}>Polarity:</label>
                                        <div className="relative flex-grow">
                                            <select
                                                value={currentEditedPolarity}
                                                onChange={(e) => setCurrentEditedPolarity(e.target.value)}
                                                className={`appearance-none block w-full px-3 py-2 border rounded-full shadow-sm text-sm ${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.focusRing} pr-8 transition duration-150 ease-in-out`}
                                            >
                                                {sentimentPolarities.map(pol => (
                                                    <option key={pol} value={pol} className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'}>
                                                        {pol}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 mt-2 sm:mt-0">
                                            <button
                                                type="button"
                                                onClick={handleSaveEdit}
                                                className={`px-3 py-1 text-white text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${colors.editSaveButton} ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className={`px-3 py-1 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${colors.editCancelButton} ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className={`font-medium capitalize ${colors.subTextColor}`}>{result.category}:</span>
                                        <div className="flex items-center mt-2 sm:mt-0">
                                            <span className={`font-semibold ${getSentimentColor(result.polarity)} mr-2`}>
                                                {result.polarity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleEditClick(index)}
                                                className={`${colors.editButton} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1 mr-1 ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
                                                aria-label={`Edit ${result.category} aspect`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAspect(index)}
                                                className={`${colors.removeButton} focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1 ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
                                                aria-label={`Remove ${result.category} aspect`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={`italic ${colors.subTextColor} mt-4`}>No specific aspects were identified in your review, or they have been removed.</p>
                )}

              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isProcessing || editingAspectIndex !== null || showManualAddForm} // Disable submit while editing or manual add form is open
                className={`mt-6 w-full text-white py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${colors.buttonBgSuccess} ${colors.buttonDisabled} ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
              >
                {isProcessing ? 'Submitting...' : 'Confirm and Submit Review'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SubmitReview;