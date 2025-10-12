# backend/crud.py

from .models import Station, Review, AspectSentiments
from backend import db
from datetime import datetime
from backend import model_loader
from sqlalchemy import func

def get_stations():
    # Retrieve all station objects from the database
    return Station.query.all()

def create_station(name):
    # Create a new Station object with the provided name
    station = Station(name=name)
    # Add the new station to the database session
    db.session.add(station)
    # Commit the changes to the database
    db.session.commit()
    return station

def create_station_review(station_id, text, submitted_analyzed_aspects=None): # Added optional parameter
    print("DEBUG: Inside create_station_review function!")

    station = Station.query.get(station_id)
    if not station:
        raise ValueError(f"Station with ID {station_id} not found.")

    # Only perform ABSA analysis if submitted_analyzed_aspects are NOT provided
    if submitted_analyzed_aspects is None:
        analyzed_aspects = model_loader.perform_absa_analysis(text)
    else:
        analyzed_aspects = submitted_analyzed_aspects # Use the provided (and potentially edited) aspects
    
    now_dt = datetime.now()

    # Create a new Review object with the provided data
    review = Review(
        station_id=station_id,
        raw_reviews=text,
        review_date=now_dt.strftime('%Y-%m-%d %H:%M:%S'),  # this can still be string
        precise_review_datetime=now_dt,  # this is datetime object
        station_name=station.station_name,
        is_estimated_date=False
    )

    db.session.add(review)
    db.session.commit()

    for aspect_data in analyzed_aspects:
        # Ensure aspect_data has the expected keys even if it's from frontend
        # You might want more robust validation here if frontend data can be malformed
        aspect_sentiment_entry = AspectSentiments(
            review_id=review.reviews_id,
            station_id=station_id,
            segment_index=aspect_data.get('segment_index', 0), # Use .get() in case segment_index is missing
            segment_text=aspect_data.get('term', text), # Use 'term' from analysis, or fallback to full review text
            aspect_category=aspect_data.get('category'),
            sentiment_polarity=aspect_data.get('polarity'),
            extracted_aspect_term=aspect_data.get('term'), # Assuming 'term' is the extracted aspect
            analysis_method='Manual Edit' if submitted_analyzed_aspects else 'Hybrid' # Indicate if edited
        )
        db.session.add(aspect_sentiment_entry)
    
    db.session.commit()

    return review, analyzed_aspects

# NEW FUNCTION: For previewing analysis without saving
def analyze_review_only(text):
    return model_loader.perform_absa_analysis(text)

# --- NEW DASHBOARD DATA FUNCTIONS ---

# 1. Overall Sentiment Distribution
def get_overall_sentiment_distribution():
    results = db.session.query(
        AspectSentiments.sentiment_polarity,
        db.func.count(AspectSentiments.aspect_sentiment_id)
    ).group_by(
        AspectSentiments.sentiment_polarity
    ).all()
    
    data = {r[0]: r[1] for r in results}
    # Ensure all polarities are present, even if count is 0
    return {
        "Positive": data.get("Positive", 0),
        "Negative": data.get("Negative", 0),
        "Neutral": data.get("Neutral", 0) # Assuming 'Neutral' polarity exists
    }

# 2. Sentiment Distribution by Aspect Category
def get_sentiment_by_aspect_category():
    results = db.session.query(
        AspectSentiments.aspect_category,
        AspectSentiments.sentiment_polarity,
        db.func.count(AspectSentiments.aspect_sentiment_id)
    ).group_by(
        AspectSentiments.aspect_category,
        AspectSentiments.sentiment_polarity
    ).all()

    # Define the 5 core aspects + 'other/uncategorized' for consistent output
    target_aspects = ['cleanliness', 'comfort', 'safety', 'service', 'facilities', 'other/uncategorized']
    
    # Initialize structure
    data = {
        aspect: {"Positive": 0, "Negative": 0, "Neutral": 0}
        for aspect in target_aspects
    }

    for category, polarity, count in results:
        normalized_category = category.lower()
        if normalized_category == 'other':
            normalized_category = 'other/uncategorized'
            
        if normalized_category in data:
            data[normalized_category][polarity] = count
    
    # Format for chart.js (or similar)
    chart_data = {
        "labels": [aspect.capitalize() for aspect in target_aspects],
        "positive": [data[aspect]["Positive"] for aspect in target_aspects],
        "neutral": [data[aspect]["Neutral"] for aspect in target_aspects],
        "negative": [data[aspect]["Negative"] for aspect in target_aspects],
    }
    return chart_data


# 3. Top N Positive/Negative Aspects (Combined Function)
def get_top_n_aspects(n=5):
    # Top Positive Aspects
    top_positive_results = db.session.query(
        AspectSentiments.aspect_category,
        db.func.count(AspectSentiments.aspect_sentiment_id)
    ).filter(
        AspectSentiments.sentiment_polarity == 'Positive',
        AspectSentiments.aspect_category != 'other/uncategorized' # Exclude 'other' for top aspects
    ).group_by(
        AspectSentiments.aspect_category
    ).order_by(
        db.func.count(AspectSentiments.aspect_sentiment_id).desc()
    ).limit(n).all()

    top_positive = [{"category": r[0], "count": r[1]} for r in top_positive_results]

    # Top Negative Aspects
    top_negative_results = db.session.query(
        AspectSentiments.aspect_category,
        db.func.count(AspectSentiments.aspect_sentiment_id)
    ).filter(
        AspectSentiments.sentiment_polarity == 'Negative',
        AspectSentiments.aspect_category != 'other/uncategorized' # Exclude 'other' for top aspects
    ).group_by(
        AspectSentiments.aspect_category
    ).order_by(
        db.func.count(AspectSentiments.aspect_sentiment_id).desc()
    ).limit(n).all()
    
    top_negative = [{"category": r[0], "count": r[1]} for r in top_negative_results]

    return {"top_positive": top_positive, "top_negative": top_negative}


# 5. Station Comparison by Overall Sentiment
def get_station_sentiment_comparison():
    results = db.session.query(
        Station.station_name,
        AspectSentiments.sentiment_polarity,
        db.func.count(AspectSentiments.aspect_sentiment_id)
    ).join(
        Station, AspectSentiments.station_id == Station.station_id
    ).group_by(
        Station.station_name,
        AspectSentiments.sentiment_polarity
    ).all()

    station_data = {}
    for station_name, polarity, count in results:
        if station_name not in station_data:
            station_data[station_name] = {"Positive": 0, "Negative": 0, "Neutral": 0, "Total": 0}
        
        station_data[station_name][polarity] = count
        station_data[station_name]["Total"] += count
    
    # Calculate sentiment scores for each station
    # Example: Net sentiment = (Positive - Negative) / Total
    # Or just return raw counts for grouped bar chart
    formatted_data = {
        "labels": [],
        "positive": [],
        "neutral": [],
        "negative": []
    }

    for station_name in sorted(station_data.keys()): # Sort by station name for consistency
        formatted_data["labels"].append(station_name)
        formatted_data["positive"].append(station_data[station_name]["Positive"])
        formatted_data["neutral"].append(station_data[station_name]["Neutral"])
        formatted_data["negative"].append(station_data[station_name]["Negative"])
        
    return formatted_data


# MODIFIED FUNCTION: Get total number of analyzed aspects (rows) across all stations
def get_total_reviews_all_stations():
    """Calculates the total number of rows (analyzed aspects) in the AspectSentiments table."""
    total_aspect_sentiments = db.session.query(AspectSentiments).count() # Changed to count AspectSentiments
    return total_aspect_sentiments


def get_overall_sentiment_analysis():
    """
    Calculates aggregate sentiment counts (Positive, Neutral, Negative)
    for each aspect category across ALL stations.
    """
    results = db.session.query(
        AspectSentiments.aspect_category,
        AspectSentiments.sentiment_polarity,
        func.count().label('count')
    ).group_by(
        AspectSentiments.aspect_category,
        AspectSentiments.sentiment_polarity
    ).all()

    overall_aspect_data = {}
    overall_total_reviews = 0 # To count all sentiment entries

    for aspect_category, polarity, count in results:
        if aspect_category not in overall_aspect_data:
            overall_aspect_data[aspect_category] = {
                "Positive": 0,
                "Neutral": 0,
                "Negative": 0
            }
        overall_aspect_data[aspect_category][polarity] += count
        overall_total_reviews += count # Accumulate total reviews

    return {
        "aspect_data": overall_aspect_data,
        "overall_total_reviews": overall_total_reviews
    }







    