import os
from dotenv import load_dotenv

# Application configuration
LOG_DIR = os.path.join(os.path.expanduser('~'), '.azor')
OUTPUT_DIR = os.path.join(os.path.expanduser('~'), '.azor', 'output')
WAL_FILE = os.path.join(LOG_DIR, 'azor-wal.json')

# TTS configuration
# Path to reference speaker WAV file for voice cloning
# Can be overridden via TTS_SPEAKER_WAV environment variable
DEFAULT_SPEAKER_WAV = os.path.join(os.path.dirname(__file__), 'tts', 'sample-agent.wav')
TTS_SPEAKER_WAV = os.getenv('TTS_SPEAKER_WAV', DEFAULT_SPEAKER_WAV)

os.makedirs(LOG_DIR, exist_ok=True)
load_dotenv()

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)
