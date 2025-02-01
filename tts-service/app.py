from flask import Flask
from flask_cors import CORS

from routes import tts_routes

import sys
from pathlib import Path

from melo.api import TTS

submodule_path = Path(__file__).resolve().parent / "external/melo"
sys.path.append(str(submodule_path))

app = Flask(__name__)
CORS(app)

app.register_blueprint(tts_routes.bp)

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=4002)
