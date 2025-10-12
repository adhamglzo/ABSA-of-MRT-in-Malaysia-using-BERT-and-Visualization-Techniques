
from backend import db

class Station(db.Model):
    __tablename__ = 'stations'  # Name of the actual table in the database

    station_id = db.Column(db.Integer, primary_key=True)
    station_name = db.Column(db.String(255), nullable=False, unique=True)

    # Relationship to connect with reviews
    reviews = db.relationship('Review', backref='station', lazy=True)


class Review(db.Model):
    __tablename__ = 'reviews'  # Actual table name in DB

    reviews_id = db.Column(db.Integer, primary_key=True)
    station_id = db.Column(db.Integer, db.ForeignKey('stations.station_id'), nullable=False)
    review_date = db.Column(db.String(255), nullable=False)  # TEXT in SQLite, so String here
    raw_reviews = db.Column(db.Text, nullable=False)
    station_name = db.Column(db.String(255), nullable=False)
     # These are the columns you just added to your SQLite database
    precise_review_datetime = db.Column(db.DateTime) # For storing converted datetime objects. SQLAlchemy handles TEXT to DateTime.
    is_estimated_date = db.Column(db.Boolean)    # SQLite stores BOOLEAN as INTEGER 0 or 1. SQLAlchemy handles this.


class AspectSentiments(db.Model):
    __tablename__ = 'AspectSentiments' # Ensure this matches your actual table name

    aspect_sentiment_id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, nullable=False) # Consider making this a ForeignKey if 'reviews' table has matching IDs
    station_id = db.Column(db.Integer, db.ForeignKey('stations.station_id'), nullable=False) # Link to stations table
    segment_index = db.Column(db.Integer, nullable=False)
    segment_text = db.Column(db.Text, nullable=False)
    aspect_category = db.Column(db.String(255), nullable=False)
    sentiment_polarity = db.Column(db.String(50), nullable=False)
    extracted_aspect_term = db.Column(db.Text)
    analysis_method = db.Column(db.String(50))

    # Optional: Add a relationship if you want to access review details from an aspect sentiment
    # review = db.relationship('Review', foreign_keys=[review_id], primaryjoin="Review.reviews_id == AspectSentiments.review_id")
    # station_rel = db.relationship('Station', foreign_keys=[station_id], primaryjoin="Station.station_id == AspectSentiments.station_id")
