from typing import List, Dict
from files.config import OUTPUT_DIR, TEMP_AUDIO_DIR, ASSISTANT_SPEAKER_WAV, USER_SPEAKER_WAV
from cli import console
import os
import threading

def concatenate_wav_files(input_files: List[str], output_path: str) -> bool:
    """
    Concatenates multiple WAV files into one, normalizing audio parameters.
    Uses pydub to handle different sample rates, channels, and bit depths.
    
    Args:
        input_files: List of paths to WAV files to concatenate
        output_path: Path where the concatenated file should be saved
        
    Returns:
        bool: True if concatenation was successful, False otherwise
    """
    if not input_files:
        return False
    
    try:
        from pydub import AudioSegment
        
        # Load all audio files
        audio_segments = []
        for file_path in input_files:
            try:
                audio = AudioSegment.from_wav(file_path)
                audio_segments.append(audio)
            except Exception as e:
                console.print_error(f"⚠️  Nie udało się wczytać pliku {file_path}: {e}")
                continue
        
        if not audio_segments:
            console.print_error("❌ Nie udało się wczytać żadnego pliku audio.")
            return False
        
        # Normalize all segments to the same parameters (use first file as reference)
        reference = audio_segments[0]
        normalized_segments = [reference]
        
        for i, audio in enumerate(audio_segments[1:], 1):
            # Normalize sample rate, channels, and sample width
            normalized = audio.set_frame_rate(reference.frame_rate)
            normalized = normalized.set_channels(reference.channels)
            normalized = normalized.set_sample_width(reference.sample_width)
            normalized_segments.append(normalized)
        
        # Concatenate all segments
        final_audio = sum(normalized_segments)
        
        # Export to WAV file
        final_audio.export(output_path, format="wav")
        
        return True
        
    except ImportError:
        console.print_error("❌ Biblioteka pydub nie jest zainstalowana. Zainstaluj ją: pip install pydub")
        return False
    except Exception as e:
        console.print_error(f"❌ Błąd podczas łączenia plików audio: {e}")
        return False

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
    
    # Check if speaker reference files exist
    if not os.path.exists(ASSISTANT_SPEAKER_WAV):
        console.print_error(f"Plik referencyjny głosu asystenta nie istnieje: {ASSISTANT_SPEAKER_WAV}")
        console.print_error("Ustaw zmienną środowiskową ASSISTANT_SPEAKER_WAV lub umieść plik assistant-sample.wav w katalogu src/files/tts/speakers/")
        return
    
    if not os.path.exists(USER_SPEAKER_WAV):
        console.print_error(f"Plik referencyjny głosu użytkownika nie istnieje: {USER_SPEAKER_WAV}")
        console.print_error("Ustaw zmienną środowiskową USER_SPEAKER_WAV lub umieść plik user-sample.wav w katalogu src/files/tts/speakers/")
        return
    
    console.print_info("▶️  Uruchomienie generowania pliku audio z całej konwersacji...")
    console.print_info(f"   - Liczba wiadomości w historii: {len(history)}")
    
    # Lazy import - TTS libraries are heavy and slow to load
    from files.tts import TTSGenerator
    from files.tts.animate import run_tts_animation
    
    tts_generator = TTSGenerator()
    temp_files = []
    failed_temp_files = set()
    
    # Generate audio for each message
    for idx, message in enumerate(history, 1):
        role = message.get('role', '')
        
        # Extract text from message
        text = ""
        if 'parts' in message and message['parts']:
            text = message['parts'][0].get('text', '')
        
        if not text:
            console.print_info(f"   ⏭️  Pomijam wiadomość {idx} (pusta)")
            continue
        
        # Determine speaker based on role
        if role == 'model':
            speaker_wav = ASSISTANT_SPEAKER_WAV
            speaker_label = assistant_name
        elif role == 'user':
            speaker_wav = USER_SPEAKER_WAV
            speaker_label = "Użytkownik"
        else:
            console.print_info(f"   ⏭️  Pomijam wiadomość {idx} (nieznana rola: {role})")
            continue
        
        # Generate temporary filename
        temp_filename = f"{session_id}-temp-{idx:04d}.wav"
        temp_path = os.path.join(TEMP_AUDIO_DIR, temp_filename)
        temp_files.append(temp_path)
        
        console.print_info(f"   🎤 Generowanie audio {idx}/{len(history)}: {speaker_label}...")
        
        # Generate audio in thread with animation
        generation_result = {"success": False, "error": None}
        
        def generate_audio_thread():
            """Thread for asynchronous audio generation."""
            try:
                success = tts_generator.generate_audio(
                    text=text,
                    output_path=temp_path,
                    speaker_wav_path=speaker_wav,
                    language="pl"
                )
                generation_result["success"] = success
            except Exception as e:
                generation_result["error"] = str(e)
                generation_result["success"] = False
        
        generation_thread = threading.Thread(target=generate_audio_thread)
        generation_thread.start()
        
        # Show animation while generating
        run_tts_animation(
            target_text=f" GENEROWANIE AUDIO {idx}/{len(history)}... ",
            thread_to_monitor=generation_thread
        )
        
        # Check result
        if generation_result["error"]:
            console.print_error(f"   ❌ Błąd podczas generowania audio dla wiadomości {idx}: {generation_result['error']}")
            failed_temp_files.add(temp_path)
        elif not generation_result["success"]:
            console.print_error(f"   ❌ Nie udało się wygenerować audio dla wiadomości {idx}")
            failed_temp_files.add(temp_path)
    
    # Filter out failed files
    successful_temp_files = [f for f in temp_files if f not in failed_temp_files]
    
    if not successful_temp_files:
        console.print_error("❌ Nie udało się wygenerować żadnego pliku audio.")
        return
    
    # Concatenate all audio files
    console.print_info(f"🔗 Łączenie {len(successful_temp_files)} plików audio w jeden...")
    
    concatenation_success = concatenate_wav_files(successful_temp_files, output_path)
    
    if not concatenation_success:
        console.print_error("❌ Nie udało się połączyć plików audio.")
        return
    
    # Clean up temporary files
    console.print_info("🧹 Usuwanie plików tymczasowych...")
    for temp_file in successful_temp_files:
        try:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        except Exception as e:
            console.print_error(f"⚠️  Nie udało się usunąć pliku tymczasowego {temp_file}: {e}")
    
    # Report results
    if failed_temp_files:
        console.print_info(f"⚠️  Uwaga: {len(failed_temp_files)} wiadomości nie zostało wygenerowanych.")
    
    file_size = os.path.getsize(output_path) / (1024 * 1024)  # Size in MB
    console.print_info(f"✅ Sukces! Plik '{output_path}' został wygenerowany ({file_size:.2f} MB).")
