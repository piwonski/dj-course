import os
from dotenv import load_dotenv

# Application configuration
LOG_DIR = os.path.join(os.path.expanduser('~'), '.azor')
OUTPUT_DIR = os.path.join(os.path.expanduser('~'), '.azor', 'output')
WAL_FILE = os.path.join(LOG_DIR, 'azor-wal.json')

# TTS configuration
# Path to reference speaker WAV file for voice cloning
# Can be overridden via TTS_SPEAKER_WAV environment variable
DEFAULT_SPEAKER_WAV = os.path.join(os.path.dirname(__file__), 'tts', 'speakers', 'sample-agent.wav')
TTS_SPEAKER_WAV = os.getenv('TTS_SPEAKER_WAV', DEFAULT_SPEAKER_WAV)

# Separate speaker files for assistant and user voices
# Can be overridden via environment variables
DEFAULT_ASSISTANT_SPEAKER_WAV = os.path.join(os.path.dirname(__file__), 'tts', 'speakers', 'assistant-sample.wav')
DEFAULT_USER_SPEAKER_WAV = os.path.join(os.path.dirname(__file__), 'tts', 'speakers', 'user-sample.wav')

ASSISTANT_SPEAKER_WAV = os.getenv('ASSISTANT_SPEAKER_WAV', DEFAULT_ASSISTANT_SPEAKER_WAV)
USER_SPEAKER_WAV = os.getenv('USER_SPEAKER_WAV', DEFAULT_USER_SPEAKER_WAV)

os.makedirs(LOG_DIR, exist_ok=True)
load_dotenv()

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Temporary directory for intermediate audio files
TEMP_AUDIO_DIR = os.path.join(OUTPUT_DIR, 'temp')
if not os.path.exists(TEMP_AUDIO_DIR):
    os.makedirs(TEMP_AUDIO_DIR)
