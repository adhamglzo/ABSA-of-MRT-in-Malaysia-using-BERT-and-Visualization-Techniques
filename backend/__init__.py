import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Use local path instead of OneDrive
    db_path = r"C:\Users\unitf\OneDrive\Desktop\FYP\mrt_absa_webapp\data\mrt_reviews_copy.db" 
    print("📂 DB path:", db_path)
    print("📁 File exists?", os.path.exists(db_path))

    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"      
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        from backend.models import Station, Review
        from backend.routes import bp
        app.register_blueprint(bp)

    return app


# Optional: Function to initialize the DB if needed
def init_db():
    app = create_app()
    with app.app_context():
        db.create_all()
