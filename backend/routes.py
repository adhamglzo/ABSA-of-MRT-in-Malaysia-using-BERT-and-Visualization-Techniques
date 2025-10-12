# backend/routes.py

from flask import Blueprint, render_template, request, jsonify
from . import crud
from backend import db
from backend.models import Station, AspectSentiments, Review
from sqlalchemy import func
import traceback # Import traceback for more detailed server-side error logging


bp = Blueprint('routes', __name__)

@bp.route("/")
def home():
    return jsonify({"message": "Flask backend running"})


@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


@bp.route('/api/reviews', methods=['POST'])
def submit_review():
    data = request.get_json()
    print("📥 Received data for submission:", data)

    if not data or not all(k in data for k in ['stationId', 'review', 'analyzedAspects']): # Check for analyzedAspects
        return jsonify({'error': 'Missing stationId, review, or analyzedAspects'}), 400

    try:
        review, analyzed_aspects = crud.create_station_review(
            station_id=data['stationId'],
            text=data['review'],
            submitted_analyzed_aspects=data['analyzedAspects'] # Pass it to CRUD
        )
        return jsonify({
            'message': 'Review submitted successfully and analyzed!',
            'review_id': review.reviews_id,
            'analyzed_aspects': analyzed_aspects
        })
    except Exception as e:
        print("❌ Error submitting review:", e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@bp.route('/api/stations', methods=['GET'])
def get_stations():
    try:
        stations = crud.get_stations()
        station_list = [
            {"station_id": s.station_id, "station_name": s.station_name}
            for s in stations
        ]
        return jsonify(station_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@bp.route('/api/station_sentiment/<int:station_id>', methods=['GET'])
def get_station_sentiment(station_id):
    try:
        target_aspects = ['cleanliness', 'comfort', 'safety', 'service', 'facilities', 'other/uncategorized']
        sentiment_data = {}
        overall_total_reviews = 0 # Initialize overall total

        # Initialize all aspect categories with counts and total
        for aspect in target_aspects:
            sentiment_data[aspect] = {
                'Positive': 0,
                'Negative': 0,
                'Neutral': 0,
                'total': 0    # This will be the direct count per aspect category
            }

        # Query for counts by aspect_category and sentiment_polarity
        polarity_results = db.session.query(
            AspectSentiments.aspect_category,
            AspectSentiments.sentiment_polarity,
            db.func.count(AspectSentiments.aspect_sentiment_id)
        ).filter(
            AspectSentiments.station_id == station_id
        ).group_by(
            AspectSentiments.aspect_category,
            AspectSentiments.sentiment_polarity
        ).all()

        # Populate polarity counts and sum for 'total' from polarity_results
        for aspect_category, sentiment_polarity, count in polarity_results:
            normalized_aspect = aspect_category.lower()
            if normalized_aspect == 'other':
                normalized_aspect = 'other/uncategorized'

            if normalized_aspect in sentiment_data:
                capitalized_polarity = sentiment_polarity.capitalize()
                if capitalized_polarity in sentiment_data[normalized_aspect]:
                    sentiment_data[normalized_aspect][capitalized_polarity] += count
            else:
                print(f"Warning: Untracked aspect category '{aspect_category}' for station {station_id}")

        # Query for raw total count per aspect (to match your DB filter)
        raw_total_results = db.session.query(
            AspectSentiments.aspect_category,
            db.func.count(AspectSentiments.aspect_sentiment_id)
        ).filter(
            AspectSentiments.station_id == station_id
        ).group_by(
            AspectSentiments.aspect_category
        ).all()

        # Update the 'total' field for each aspect with the raw count and sum for overall_total_reviews
        for category, count in raw_total_results:
            normalized_category = category.lower()
            if normalized_category == 'other':
                normalized_category = 'other/uncategorized'

            if normalized_category in sentiment_data:
                sentiment_data[normalized_category]['total'] = count # Overwrite with raw count
                overall_total_reviews += count # Add to the overall total

        # Return both the detailed aspect data and the overall total
        return jsonify({
            'aspect_data': sentiment_data,
            'overall_total_reviews': overall_total_reviews
        })

    except Exception as e:
        print(f"Error fetching station sentiment for station_id {station_id}: {e}")
        return jsonify({"error": str(e)}), 500

# NEW ROUTE: For analyzing review without saving
@bp.route('/api/analyze_review', methods=['POST'])
def analyze_review_endpoint():
    data = request.get_json()
    print("📥 Received data for analysis preview:", data)

    if not data or 'review' not in data:
        return jsonify({'error': 'Missing review text for analysis'}), 400

    try:
        analyzed_aspects = crud.analyze_review_only(data['review'])
        return jsonify({
            'message': 'Review analyzed successfully!',
            'analyzed_aspects': analyzed_aspects
        })
    except Exception as e:
        print("❌ Error analyzing review:", e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# --- NEW DASHBOARD ENDPOINTS ---

@bp.route('/api/dashboard/overall_sentiment', methods=['GET'])
def get_overall_sentiment():
    try:
        data = crud.get_overall_sentiment_distribution()
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching overall sentiment: {e}")
        return jsonify({"error": str(e)}), 500

@bp.route('/api/dashboard/aspect_sentiment', methods=['GET'])
def get_aspect_sentiment():
    try:
        data = crud.get_sentiment_by_aspect_category()
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching aspect sentiment: {e}")
        return jsonify({"error": str(e)}), 500

@bp.route('/api/dashboard/top_aspects', methods=['GET'])
def get_top_aspects():
    try:
        data = crud.get_top_n_aspects()
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching top aspects: {e}")
        return jsonify({"error": str(e)}), 500

@bp.route('/api/dashboard/station_comparison', methods=['GET'])
def get_station_comparison():
    try:
        data = crud.get_station_sentiment_comparison()
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching station comparison: {e}")
        return jsonify({"error": str(e)}), 500


# NEW ROUTE: Get total reviews for all stations (Already exists, good!)
@bp.route('/api/total_reviews_all_stations', methods=['GET'])
def get_total_reviews_all_stations_route():
    try:
        total = crud.get_total_reviews_all_stations()
        return jsonify({'total_reviews': total})
    except Exception as e:
        print(f"Error fetching total reviews for all stations: {e}")
        return jsonify({"error": str(e)}), 500

# NEW ROUTE: Get overall positive sentiment percentage for quick insight
@bp.route('/api/overall_positive_sentiment_percentage', methods=['GET'])
def get_overall_positive_sentiment_percentage():
    try:
        # Query total positive, neutral, and negative sentiments
        sentiment_counts = db.session.query(
            AspectSentiments.sentiment_polarity,
            func.count(AspectSentiments.sentiment_polarity)
        ).group_by(AspectSentiments.sentiment_polarity).all()

        total_sentiments = sum(count for _, count in sentiment_counts)
        positive_sentiments = next((count for polarity, count in sentiment_counts if polarity.lower() == 'positive'), 0)

        if total_sentiments == 0:
            percentage = 0
        else:
            percentage = (positive_sentiments / total_sentiments) * 100

        return jsonify({'positive_sentiment_percentage': round(percentage, 2)})
    except Exception as e:
        print(f"Error fetching overall positive sentiment percentage: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@bp.route('/api/trend/aspect_sentiment', methods=['GET'])
def get_aspect_sentiment_trend():
    try:
        results = db.session.query(
            func.strftime('%Y-%m', Review.precise_review_datetime).label("month"),
            AspectSentiments.aspect_category,
            AspectSentiments.sentiment_polarity,
            func.count().label("count")
        ).join(Review, AspectSentiments.review_id == Review.reviews_id) \
         .group_by("month", AspectSentiments.aspect_category, AspectSentiments.sentiment_polarity) \
         .order_by("month").all()

        trend_data = {}
        for month, aspect, polarity, count in results:
            key = f"{aspect.lower()}_{polarity.lower()}"
            if month not in trend_data:
                trend_data[month] = {}
            trend_data[month][key] = count

        return jsonify(trend_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# NEW: Endpoint for overall review counts over time
@bp.route('/api/dashboard/reviews_over_time', methods=['GET'])
def get_reviews_over_time():
    try:
        results = db.session.query(
            func.strftime('%Y', Review.precise_review_datetime).label("year"), # Changed from %Y-%m to %Y, and label from month to year
            func.count(Review.reviews_id).label("review_count")
        ).filter(
            Review.precise_review_datetime.isnot(None) # Exclude null dates
        ).group_by("year") \
         .order_by("year").all()

        data = {year: count for year, count in results} # Changed from month to year
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching reviews over time: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# NEW: Endpoint for sentiment counts over time (for stacked bar chart)
@bp.route('/api/dashboard/sentiment_counts_over_time', methods=['GET'])
def get_sentiment_counts_over_time():
    try:
        results = db.session.query(
            func.strftime('%Y-%m', Review.precise_review_datetime).label("month"),
            AspectSentiments.sentiment_polarity,
            func.count(AspectSentiments.aspect_sentiment_id).label("count")
        ).join(Review, AspectSentiments.review_id == Review.reviews_id) \
         .filter(
            Review.precise_review_datetime.isnot(None)
         ).group_by("month", AspectSentiments.sentiment_polarity) \
         .order_by("month", AspectSentiments.sentiment_polarity).all()

        # Transform data into a format suitable for the frontend
        # { "month1": { "positive": X, "neutral": Y, "negative": Z }, "month2": ... }
        processed_data = {}
        for month, polarity, count in results:
            if month not in processed_data:
                processed_data[month] = {"positive": 0, "neutral": 0, "negative": 0}
            processed_data[month][polarity.lower()] = count

        # Ensure all months have all polarities, even if count is 0
        all_months = sorted(list(processed_data.keys()))
        final_data = {}
        for month in all_months:
            final_data[month] = {
                "positive": processed_data[month].get("positive", 0),
                "neutral": processed_data[month].get("neutral", 0),
                "negative": processed_data[month].get("negative", 0)
            }

        return jsonify(final_data)
    except Exception as e:
        print(f"Error fetching sentiment counts over time: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# in routes.py
@bp.route("/api/dashboard/latest_reviews", methods=["GET"])
def get_latest_reviews():
    db_session = db.session
    results = (
        db_session.query(Review.station_name, Review.raw_reviews.label("review_text"), Review.precise_review_datetime) # Added precise_review_datetime
        .order_by(Review.precise_review_datetime.desc()) # Changed to precise_review_datetime
        .limit(5)
        .all()
    )
    # Ensure precise_review_datetime is formatted as a string (date only)
    reviews = [{"station_name": r.station_name, "review_text": r.review_text, "review_date": r.precise_review_datetime.strftime('%Y-%m-%d')} for r in results]
    db_session.close()
    return jsonify({"reviews": reviews})

@bp.route('/api/overall_sentiment_analysis', methods=['GET'])
def overall_sentiment_analysis():
    try:
        data = crud.get_overall_sentiment_analysis()
        return jsonify(data)
    except Exception as e:
        traceback.print_exc() # Print full traceback for debugging
        return jsonify({'error': str(e)}), 500

# NEW ROUTE for total reviews by station
@bp.route('/api/dashboard/total_reviews_by_station', methods=['GET'])
def get_total_reviews_by_station():
    try:
        results = db.session.query(
            Station.station_name,
            func.count(AspectSentiments.aspect_sentiment_id).label('total_reviews')
        ).join(AspectSentiments, Station.station_id == AspectSentiments.station_id) \
         .group_by(Station.station_name) \
         .order_by(Station.station_name).all()

        data = {
            'labels': [r.station_name for r in results],
            'total_reviews': [r.total_reviews for r in results]
        }
        return jsonify(data)
    except Exception as e:
        print(f"Error fetching total reviews by station: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500