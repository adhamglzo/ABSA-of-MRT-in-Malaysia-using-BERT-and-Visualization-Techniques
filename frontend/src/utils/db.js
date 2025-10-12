// frontend/src/utils/db.js

// API endpoints
const API_BASE_URL = 'http://localhost:5000/api'; // Changed to absolute URL for clarity, adjust if needed

// Get all stations
export async function getAllStations() {
  try {
    console.log('Attempting to fetch stations from:', `${API_BASE_URL}/stations`);
    const response = await fetch(`${API_BASE_URL}/stations`);

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch stations: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully received stations data:', data);

    return data;
  } catch (error) {
    console.error('Detailed error in getAllStations:', error);
    throw error;
  }
}

// Get station sentiment analysis
export async function getStationSentimentAnalysis(stationId) {
  try {
    console.log('Fetching sentiment analysis for station:', stationId);
    const response = await fetch(`${API_BASE_URL}/station_sentiment/${stationId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch sentiment analysis: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }
    const data = await response.json();
    console.log('Received sentiment data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching sentiment analysis:', error);
    throw error;
  }
}

// Submit a new review
export async function submitReview(stationId, review, analyzedAspects) { // Added analyzedAspects
  try {
    console.log('Submitting review:', { stationId, review, analyzedAspects }); // Log for debugging
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stationId,
        review,
        analyzedAspects, // Include the analyzed/edited aspects
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to submit review: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Review submission response:', data);
    return data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

// Analyze review preview
export async function analyzeReviewPreview(reviewText) {
  try {
    console.log('Analyzing review preview:', reviewText);
    const response = await fetch(`${API_BASE_URL}/analyze_review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ review: reviewText }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to analyze review preview: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Review analysis preview response:', data);
    return data;
  } catch (error) {
    console.error('Error analyzing review preview:', error);
    throw error;
  }
}

// --- NEW DASHBOARD API CALLS ---

// 1. Get Overall Sentiment Distribution
export async function getOverallSentimentData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/overall_sentiment`);
        if (!response.ok) throw new Error(`Failed to fetch overall sentiment: ${response.statusText}`);
        const data = await response.json();
        console.log('Overall Sentiment Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching overall sentiment data:', error);
        throw error;
    }
}

// 2. Get Sentiment Distribution by Aspect Category
export async function getAspectSentimentData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/aspect_sentiment`);
        if (!response.ok) throw new Error(`Failed to fetch aspect sentiment: ${response.statusText}`);
        const data = await response.json();
        console.log('Aspect Sentiment Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching aspect sentiment data:', error);
        throw error;
    }
}

// 3. Get Top N Positive/Negative Aspects
export async function getTopAspectsData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/top_aspects`);
        if (!response.ok) throw new Error(`Failed to fetch top aspects: ${response.statusText}`);
        const data = await response.json();
        console.log('Top Aspects Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching top aspects data:', error);
        throw error;
    }
}

// 5. Get Station Comparison by Overall Sentiment
export async function getStationComparisonData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/station_comparison`);
        if (!response.ok) throw new Error(`Failed to fetch station comparison: ${response.statusText}`);
        const data = await response.json();
        console.log('Station Comparison Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching station comparison data:', error);
        throw error;
    }
}

// NEW API CALL: Get total number of reviews across all stations
export async function getTotalReviewsAllStations() {
  try {
    console.log('Fetching total reviews for all stations from:', `${API_BASE_URL}/total_reviews_all_stations`);
    const response = await fetch(`${API_BASE_URL}/total_reviews_all_stations`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch total reviews for all stations: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Successfully received total reviews data:', data);
    return data.total_reviews; // Assuming the backend sends { 'total_reviews': count }
  } catch (error) {
    console.error('Error fetching total reviews for all stations:', error);
    throw error;
  }
}

const generateAspectTrendChart = (data) => {
  const months = Object.keys(data);
  const aspects = ['cleanliness', 'comfort', 'safety', 'service', 'facilities'];
  const polarities = ['positive', 'neutral', 'negative'];

  const datasets = [];

  for (const aspect of aspects) {
    for (const polarity of polarities) {
      const label = `${aspect} (${polarity})`;
      const lineColor = polarity === 'positive' ? '#4CAF50' : polarity === 'neutral' ? '#FFC107' : '#F44336';
      datasets.push({
        label,
        data: months.map(m => data[m]?.[`${aspect}_${polarity}`] || 0),
        borderColor: lineColor,
        fill: false
      });
    }
  }

  return {
    labels: months,
    datasets
  };
};


const generateCumulativeTrendChart = (data) => {
  const months = Object.keys(data);
  const sentimentTypes = ['positive', 'neutral', 'negative'];
  const colors = { positive: '#4CAF50', neutral: '#FFC107', negative: '#F44336' };

  return {
    labels: months,
    datasets: sentimentTypes.map(type => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      data: months.map(m => data[m]?.[type] || 0),
      borderColor: colors[type],
      fill: false
    }))
  };
};

// Get overall sentiment analysis for all stations
export async function getOverallSentimentAnalysis() {
  try {
    console.log('Fetching overall sentiment analysis from:', `${API_BASE_URL}/overall_sentiment_analysis`);
    const response = await fetch(`${API_BASE_URL}/overall_sentiment_analysis`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch overall sentiment: ${response.status} ${response.statusText} - ${errorData.error}`);
    }

    const data = await response.json();
    console.log('Successfully received overall sentiment data:', data);
    return data;
  } catch (error) {
    console.error('Detailed error in getOverallSentimentAnalysis:', error);
    throw error;
  }
}

// NEW API Call for Number of Reviews Over Time (Graph 1)
export async function getReviewsOverTimeData() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/reviews_over_time`);
    if (!response.ok) throw new Error(`Failed to fetch reviews over time: ${response.statusText}`);
    const data = await response.json();
    console.log('Reviews Over Time Data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching reviews over time data:', error);
    throw error;
  }
}

// NEW API Call for Sentiment Counts Over Time (Graph 2 Stacked Bar Chart)
export async function getSentimentCountsOverTimeData() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/sentiment_counts_over_time`);
    if (!response.ok) throw new Error(`Failed to fetch sentiment counts over time: ${response.statusText}`);
    const data = await response.json();
    console.log('Sentiment Counts Over Time Data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching sentiment counts over time data:', error);
    throw error;
  }
}

// NEW function to fetch total reviews by station
export async function getTotalReviewsByStationData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/total_reviews_by_station`);
        if (!response.ok) throw new Error(`Failed to fetch total reviews by station: ${response.statusText}`);
        const data = await response.json();
        console.log('Total Reviews By Station Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching total reviews by station data:', error);
        throw error;
    }
}