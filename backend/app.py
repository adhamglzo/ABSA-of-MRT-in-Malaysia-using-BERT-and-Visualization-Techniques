# backend/app.py
import os # Import the 'os' module to interact with the operating system
from flask_cors import CORS # Import the Flask-CORS extension to handle cross-origin requests

# Import the application factory and database object from the backend package
from backend import create_app, db

# Create the Flask application instance using the factory function
app = create_app()

# Enable CORS (Cross-Origin Resource Sharing) for the application
CORS(app)

# Use an application context to perform database operations
with app.app_context():
    # Create database tables for all models defined in the application
    db.create_all()

# Standard entry point to run the Flask development server
if __name__ == '__main__':
    # Run the application on a specified port, enabling debug mode
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
