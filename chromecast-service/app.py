from flask import Flask
from flask_cors import CORS
from routes import chromecast_routes

app = Flask(__name__)
CORS(app)

app.register_blueprint(chromecast_routes.bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4001)
