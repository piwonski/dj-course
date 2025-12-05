"""
Text-to-Speech generator using XTTS v2 model.
Provides lazy initialization and reuse of the TTS model instance.
"""
import os
import warnings
from typing import Tuple
import torch
from TTS.api import TTS
from cli import console

# Biblioteka Coqui TTS generuje wiele nieistotnych ostrzeżeń UserWarning
# (np. o deprecacjach, optymalizacjach, wersjach zależności), które zaśmiecają konsolę.
# Filtrujemy je, aby zachować czytelność outputu aplikacji.
warnings.filterwarnings("ignore", category=UserWarning)


class TTSGenerator:
    """
    Text-to-Speech generator that uses XTTS v2 model.
    The model is initialized lazily on first use and reused for subsequent calls.
    """
    
    _instance = None
    _tts_model = None
    _device = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern - ensures only one instance exists."""
        if cls._instance is None:
            cls._instance = super(TTSGenerator, cls).__new__(cls)
        return cls._instance
    
    def _detect_device(self) -> Tuple[str, str]:
        """
        Automatically detects the best available device for TTS processing.
        
        Returns:
            tuple: (device_name, device_display_name)
        """
        if torch.backends.mps.is_available():
            return "mps", "Metal Performance Shaders (Apple GPU)"
        elif torch.cuda.is_available():
            return "cuda", "CUDA (NVIDIA GPU)"
        else:
            return "cpu", "CPU"
    
    def _initialize_model(self):
        """
        Lazy initialization of the TTS model.
        Called automatically on first use.
        """
        if self._initialized:
            return
        
        device, device_name = self._detect_device()
        self._device = device
        
        try:
            console.print_info(f"🔧 Wykryte urządzenie: {device_name}")
            console.print_info("🤖 Ładowanie modelu TTS...")
            
            self._tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
            self._initialized = True
            
            console.print_info(f"✅ Model załadowany pomyślnie na {device.upper()}.")
        except Exception as e:
            console.print_error(f"❌ Błąd ładowania modelu TTS: {e}")
            raise
    
    def generate_audio(
        self,
        text: str,
        output_path: str,
        speaker_wav_path: str,
        language: str = "pl"
    ) -> bool:
        """
        Generates an audio file from text using the TTS model.
        
        Args:
            text: Text to convert to speech
            output_path: Path where the output WAV file should be saved
            speaker_wav_path: Path to the reference speaker WAV file for voice cloning
            language: Language code (default: "pl" for Polish)
        
        Returns:
            bool: True if generation was successful, False otherwise
        """
        # Lazy initialization on first use
        if not self._initialized:
            self._initialize_model()
        
        if not self._tts_model:
            console.print_error("Model TTS nie został zainicjalizowany.")
            return False
        
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Check if speaker file exists
        if not os.path.exists(speaker_wav_path):
            console.print_error(f"Plik referencyjny głosu nie istnieje: {speaker_wav_path}")
            return False
        
        try:
            self._tts_model.tts_to_file(
                text=text,
                file_path=output_path,
                speaker_wav=speaker_wav_path,
                language=language
            )
            
            return True
            
        except Exception as e:
            console.print_error(f"❌ Błąd podczas generowania pliku audio: {e}")
            return False
    
    def is_initialized(self) -> bool:
        """
        Checks if the TTS model has been initialized.
        
        Returns:
            bool: True if model is initialized, False otherwise
        """
        return self._initialized

