// Home.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Importing image assets from src/assets
import instagram_logo from "../assets/instagram_logo.jpg";
import tiktok_logo from "../assets/tiktok_logo.jpg";
import twitter_logo from "../assets/twitter_logo.jpg";

const Home = () => {
  const [overallPositiveSentiment, setOverallPositiveSentiment] = useState(null);
  const [totalReviews, setTotalReviews] = useState(null);
  const [latestReviews, setLatestReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sentimentResponse = await fetch('/api/overall_positive_sentiment_percentage');
        if (!sentimentResponse.ok) {
          throw new Error(`HTTP error! status: ${sentimentResponse.status}`);
        }
        const sentimentData = await sentimentResponse.json();
        setOverallPositiveSentiment(sentimentData.positive_sentiment_percentage);

        const reviewsResponse = await fetch('/api/total_reviews_all_stations');
        if (!reviewsResponse.ok) {
          throw new Error(`HTTP error! status: ${reviewsResponse.status}`);
        }
        const reviewsData = await reviewsResponse.json();
        setTotalReviews(reviewsData.total_reviews);

        const latestReviewsResponse = await fetch('/api/dashboard/latest_reviews');
        if (!latestReviewsResponse.ok) {
          throw new Error(`HTTP error! status: ${latestReviewsResponse.status}`);
        }
        const latestReviewsData = await latestReviewsResponse.json();
        setLatestReviews(latestReviewsData.reviews);

      } catch (error) {
        console.error("Error fetching homepage data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    // Base background and text colors for light mode, with dark: prefix for dark mode
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans flex flex-col items-center justify-start px-6 transition-colors duration-300">

      <main className="pt-10 pb-20 px-6 flex flex-col items-center text-center w-full max-w-5xl mx-auto flex-grow">
        <div className="mb-16 space-y-4 max-w-2xl">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">MRT Malaysia ABSA</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Analyze sentiment aspects of Malaysia's Mass Rapid Transit system using advanced BERT models.
          </p>
        </div>

        {/* Quick Insight Section */}
        <section className="w-full bg-blue-50 border border-blue-200 rounded-xl p-8 shadow-md mb-12 animate-fade-in text-center
                            dark:bg-blue-900 dark:border-blue-700 dark:shadow-lg">
          <h3 className="text-2xl font-semibold text-blue-700 mb-4 dark:text-blue-300"></h3>
          {loading ? (
            <p className="text-blue-600 dark:text-blue-400 text-xl">Loading insights...</p>
          ) : error ? (
            <p className="text-red-500 text-xl dark:text-red-400">{error}</p>
          ) : (
            overallPositiveSentiment !== null && (
              <p className="text-5xl font-bold text-blue-800 dark:text-blue-200">
                {overallPositiveSentiment}% Positive Sentiment
              </p>
            )
          )}
          <p className="text-gray-600 mt-2 text-md dark:text-gray-400">
            Overall sentiment towards MRT Malaysia based on analyzed reviews.
          </p>
        </section>

        {/* Key Facts Section */}
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 justify-items-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-md animate-slide-in-left text-center w-full h-72 flex flex-col justify-center items-center
                            dark:bg-green-900 dark:border-green-700 dark:shadow-lg">
            <h3 className="text-3xl font-semibold text-green-700 mb-3 dark:text-green-300">Total Reviews Analyzed:</h3>
            {loading ? (
              <p className="text-green-600 dark:text-green-400 text-5xl font-bold">...</p>
            ) : error ? (
              <p className="text-red-500 text-xl dark:text-red-400">{error}</p>
            ) : (
              totalReviews !== null && (
                <p className="text-6xl font-bold text-green-800 dark:text-green-200">{totalReviews}</p>
              )
            )}
          </div>

          {/* Latest Reviews Highlight Section */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-md animate-slide-in-right flex flex-col items-center w-full
                            dark:bg-purple-900 dark:border-purple-700 dark:shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3 dark:text-gray-200">Latest Reviews:</h3>
            {loading ? (
              <p className="text-purple-600 dark:text-purple-400 text-lg">Fetching latest reviews...</p>
            ) : error ? (
              <p className="text-red-500 text-xl dark:text-red-400">{error}</p>
            ) : (
              latestReviews.length > 0 ? (
                <ul className="space-y-4 max-h-56 overflow-y-auto custom-scrollbar w-full">
                  {latestReviews.map((review, index) => (
                    <li key={index} className="p-4 bg-purple-100 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:scale-102
                                                dark:bg-purple-800 dark:shadow-xl dark:hover:shadow-2xl">
                      <p className="text-indigo-700 font-bold text-base mb-1 dark:text-indigo-300">
                         <span className="text-indigo-500 font-medium text-base dark:text-indigo-400">{review.station_name}</span>
                      </p>
                      <p className="text-gray-800 text-lg italic mb-1 line-clamp-3 dark:text-gray-200">"{review.review_text}"</p>
                      <p className="text-gray-500 text-sm text-right dark:text-gray-400">{review.review_date}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg text-gray-600 dark:text-gray-400">No recent reviews available.</p>
              )
            )}
          </div>
        </section>

        {/* Call to Action for Review */}
        <section className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-8 shadow-md mb-12 animate-fade-in text-center
                            dark:bg-yellow-900 dark:border-yellow-700 dark:shadow-lg">
          <h3 className="text-2xl font-semibold text-yellow-700 mb-4 dark:text-yellow-300">Your Voice Matters!</h3>
          <p className="text-lg text-gray-700 mb-6 dark:text-gray-300">
            Have feedback about your recent MRT trip? Share your thoughts on specific aspects such as cleanliness, comfort, staff, service, safety, or any other area you'd like to highlight..
          </p>
          <Link
            to="/submit-review"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105
                       dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:text-gray-100"
          >
            Submit Your Review
          </Link>
        </section>

        {/* About Section */}
        <section className="w-full text-left bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-md mb-12 animate-fade-in-up text-center
                            dark:bg-gray-800 dark:border-gray-700 dark:shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 dark:text-gray-200">About MRT Malaysia ABSA</h3>
          <p className="text-gray-700 leading-relaxed dark:text-gray-300">
          MRT Malaysia ABSA (Aspect-Based Sentiment Analysis) is a platform that leverages BERT-based models to analyze public sentiment across Malaysia’s
          Mass Rapid Transit system, with a primary focus on the MRT Kajang Line. It aims to provide actionable insights into passenger experiences,
          identify areas for improvement, and support the enhancement of service quality at individual MRT stations. By addressing specific concerns,
          this analysis contributes to a more efficient and user-focused public transportation network.
          </p>

          <p className="text-gray-700 leading-relaxed mt-4 dark:text-gray-300">
            This system was developed as part of an academic initiative in public sentiment analysis.
          </p>
        </section>
      </main>

      {/* Footer with Social Media Icons */}
      <footer className="w-full py-8 bg-gray-100 text-gray-600 text-center border-t border-gray-200
                         dark:bg-gray-950 dark:text-gray-400 dark:border-gray-700">
        <p className="mb-4">Connect with MRT Malaysia:</p>
        <div className="flex justify-center space-x-6">
          {/* Instagram Icon */}
          <a
            href="https://www.instagram.com/myrapidkl/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-75 transition-opacity duration-300"
            aria-label="Instagram"
          >
            <img
              src={instagram_logo}
              alt="Instagram Logo"
              className="w-5 h-5 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/FF00FF/FFFFFF?text=IG"; }}
            />
          </a>
          {/* TikTok Icon */}
          <a
            href="https://www.tiktok.com/@myrapidkl?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-75 transition-opacity duration-300"
            aria-label="TikTok"
          >
            <img
              src={tiktok_logo}
              alt="TikTok Logo"
              className="w-5 h-5 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/000000/FFFFFF?text=TT"; }}
            />
          </a>
          {/* Twitter Icon */}
          <a
            href="https://x.com/MyrapidKL"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-75 transition-opacity duration-300"
            aria-label="Twitter"
          >
            <img
              src={twitter_logo}
              alt="Twitter Logo"
              className="w-5 h-5 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/1DA1F2/FFFFFF?text=TW"; }}
            />
          </a>
        </div>
        <p className="mt-6 text-sm">&copy; {new Date().getFullYear()} MRT Malaysia ABSA. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;