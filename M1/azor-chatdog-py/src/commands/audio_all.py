from typing import List, Dict
from files.config import OUTPUT_DIR, TTS_SPEAKER_WAV
from cli import console
import os

def generate_audio_from_full_conversation(history: List[Dict], session_id: str, assistant_name: str):
    """
    Generates an audio file from the entire conversation in the session.
    Messages from the assistant will be generated with a different voice than messages from the user.
    
    Technical approach:
    - Generate n audio files for n messages
    - Concatenate the generated audio files into one
    
    Args:
        history: List of dictionaries in the format {"role": "user|model", "parts": [{"text": "..."}]}
        session_id: The ID of the session
        assistant_name: The name of the assistant
    """
    if not history:
        console.print_error("Historia sesji jest pusta. Brak konwersacji do konwersji na audio.")
        return
    
    # Generate output filename
    output_filename = f"{session_id}-audio-all.wav"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # Check if speaker reference file exists
    if not os.path.exists(TTS_SPEAKER_WAV):
        console.print_error(f"Plik referencyjny głosu nie istnieje: {TTS_SPEAKER_WAV}")
        console.print_error("Ustaw zmienną środowiskową TTS_SPEAKER_WAV lub umieść plik sample-agent.wav w katalogu src/files/tts/")
        return
    
    console.print_info("▶️  Uruchomienie generowania pliku audio z całej konwersacji...")
    
    # TODO: Implementacja logiki generowania audio z całej konwersacji
    # 1. Przejść przez wszystkie wiadomości w historii
    # 2. Dla każdej wiadomości:
    #    - Określić rolę (user/model)
    #    - Wybrać odpowiedni głos lektora (różny dla user vs model)
    #    - Wygenerować plik audio dla tej wiadomości
    # 3. Połączyć wszystkie wygenerowane pliki audio w jeden plik
    # 4. Zapisać wynikowy plik jako {session_id}-audio-all.wav
    
    console.print_info(f"📝 TODO: Implementacja generowania audio z całej konwersacji")
    console.print_info(f"   - Liczba wiadomości w historii: {len(history)}")
    console.print_info(f"   - Docelowy plik wyjściowy: {output_path}")
    console.print_info(f"   - Głos asystenta: {TTS_SPEAKER_WAV}")
    console.print_info(f"   - Głos użytkownika: TODO (będzie inny głos lektora)")

