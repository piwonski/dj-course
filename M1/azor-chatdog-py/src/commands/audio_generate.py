from typing import List, Dict
from files.config import OUTPUT_DIR, TTS_SPEAKER_WAV
from cli import console
import os
import threading

def generate_audio_from_last_response(history: List[Dict], session_id: str, assistant_name: str):
    """
    Generates an audio file from the last assistant response in the session.
    
    Args:
        history: List of dictionaries in the format {"role": "user|model", "parts": [{"text": "..."}]}
        session_id: The ID of the session
        assistant_name: The name of the assistant
    """
    if not history:
        console.print_error("Historia sesji jest pusta. Brak odpowiedzi do konwersji na audio.")
        return
    
    # Find the last assistant response
    last_response = None
    for content in reversed(history):
        role = content.get('role', '')
        if role == 'model':
            last_response = content
            break
    
    if not last_response:
        console.print_error("Brak odpowiedzi asystenta w historii sesji.")
        return
    
    # Extract text from the last response
    text = ""
    if 'parts' in last_response and last_response['parts']:
        text = last_response['parts'][0].get('text', '')
    
    if not text:
        console.print_error("Ostatnia odpowiedź asystenta jest pusta.")
        return
    
    # Generate output filename
    output_filename = f"{session_id}-audio.wav"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # Check if speaker reference file exists
    if not os.path.exists(TTS_SPEAKER_WAV):
        console.print_error(f"Plik referencyjny głosu nie istnieje: {TTS_SPEAKER_WAV}")
        console.print_error("Ustaw zmienną środowiskową TTS_SPEAKER_WAV lub umieść plik sample-agent.wav w katalogu src/files/tts/speakers/")
        return

    console.print_info("▶️  Uruchomienie generowania pliku audio...")    
    
    # Lazy import - TTS libraries are heavy and slow to load
    # Import only when /audio command is actually used
    from files.tts import TTSGenerator
    from files.tts.animate import run_tts_animation
    
    # Prepare for threaded generation with animation
    tts_generator = TTSGenerator()
    generation_result = {"success": False, "error": None}
    
    def generate_audio_thread():
        """Wątek do asynchronicznego generowania pliku audio TTS."""
        try:
            success = tts_generator.generate_audio(
                text=text,
                output_path=output_path,
                speaker_wav_path=TTS_SPEAKER_WAV,
                language="pl"
            )
            generation_result["success"] = success
        except Exception as e:
            generation_result["error"] = str(e)
            generation_result["success"] = False
    
    # Start generation in a separate thread
    generation_thread = threading.Thread(target=generate_audio_thread)
    generation_thread.start()
    
    # Show animation while generating
    elapsed_time = run_tts_animation(
        target_text=" GENEROWANIE PLIKU AUDIO... ",
        thread_to_monitor=generation_thread
    )
    
    # Check result and display message
    if generation_result["error"]:
        console.print_error(f"❌ Błąd podczas generowania pliku audio: {generation_result['error']}")
    elif generation_result["success"]:
        console.print_info(f"✅ Sukces! Plik '{output_path}' został wygenerowany w {elapsed_time:.2f}s.")
    else:
        console.print_error("Nie udało się wygenerować pliku audio.")

