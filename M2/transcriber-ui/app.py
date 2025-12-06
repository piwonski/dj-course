import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk
import pyaudio
import wave
import os
import time
import threading
import queue
import sys
import logging
import logging.handlers
import json
from datetime import datetime
from typing import TextIO, Optional
import glob
try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False
    logging.warning("pygame not available. Audio playback will be disabled. Install with: pip install pygame")

# --- Global Configuration ---
APP_TITLE = "Azor Transcriber"
# Set to True to print output to the console (standard output/stderr).
VERBOSE = False
LOG_FILENAME = "transcriber.log"

# --- Logging Setup ---
class StreamToLogger(TextIO):
    """
    Fake file-like stream object that redirects writes to a logger instance.
    This captures stdout/stderr, including print() statements.
    """
    def __init__(self, logger, level):
        self.logger = logger
        self.level = level
        self.linebuf = ''

    def write(self, buf):
        # Handle buffer and write line by line
        for line in buf.rstrip().splitlines():
            # Check if the line is not empty (prevents logging empty lines from print())
            if line.strip():
                self.logger.log(self.level, line.strip())

    def flush(self):
        # Required by TextIO interface, but we flush line-by-line in write
        pass

# Configure the global logger BEFORE application startup
def setup_logging():
    """Con gures the logging system to save all output to a le and optionally to console."""
    os.makedirs('output', exist_ok=True)
    
    # 1. Root logger setup
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO) # Capture everything from INFO level up

    # 2. File Handler (Always active)
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_FILENAME, 
        maxBytes=1024*1024*5, # 5 MB per file
        backupCount=5,
        encoding='utf-8'
    )
    # Define a simple formatter for the file
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # 3. Console Handler (Only active if VERBOSE is True)
    if VERBOSE:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # 4. Redirect stdout and stderr to the logger
    sys.stdout = StreamToLogger(root_logger, logging.INFO)
    sys.stderr = StreamToLogger(root_logger, logging.ERROR)

setup_logging()
logging.info("Application initialization started.")

# --- Whisper Dependencies ---
# Ensure you have installed: pip install torch transformers librosa
# (Librosa might require ffmpeg)
try:
    import torch
    from transformers import pipeline
except ImportError:
    logging.error("ERROR: 'transformers' or 'torch' libraries not found.")
    logging.error("Install them using: pip install torch transformers")
    exit()

# === 1. Transcription Configuration ===
MODEL_NAME = "openai/whisper-tiny"

def output_filename()  -> str:
    """Generates output filename for transcription results."""
    os.makedirs('output', exist_ok=True)
    return f"output/recording-{int(time.time())}.wav"

def get_json_filename(wav_filename: str) -> str:
    """Generates JSON filename based on WAV filename."""
    return wav_filename.replace('.wav', '.json')

def save_transcription_metadata(wav_filename: str, transcription: str, recording_date: datetime = None) -> None:
    """
    Saves transcription metadata to JSON file.
    
    Args:
        wav_filename: Path to the WAV file
        transcription: The transcribed text
        recording_date: Date of recording (defaults to current time if not provided)
    """
    if recording_date is None:
        recording_date = datetime.now()
    
    json_filename = get_json_filename(wav_filename)
    metadata = {
        "date": recording_date.isoformat(),
        "filename": os.path.basename(wav_filename),
        "transcription": transcription
    }
    
    try:
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        logging.info(f"Metadata saved to {json_filename}")
    except Exception as e:
        logging.error(f"Failed to save metadata to JSON: {e}", exc_info=True)

def transcribe_audio(audio_path: str, model_name: str) -> str:
    """
    Loads the Whisper model and transcribes the audio file.
    This function is blocking and should be run in a separate thread.
    """
    try:
        logging.info(f"Loading model: {model_name}...")
        # Initialize pipeline
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        logging.info(f"Using device: {device}")
        
        asr_pipeline = pipeline(
            "automatic-speech-recognition", 
            model=model_name,
            device=device
        )

        logging.info(f"Starting transcription for file: {audio_path}...")
        result = asr_pipeline(audio_path)
        
        transcription = result["text"].strip()
        
        logging.info("Transcription finished.")
        return transcription

    except FileNotFoundError:
        logging.error(f"ERROR: Audio file not found at path: {audio_path}")
        return f"ERROR: Audio file not found at path: {audio_path}"
    except Exception as e:
        logging.error(f"An unexpected error occurred during transcription: {e}", exc_info=True)
        return f"An unexpected error occurred during transcription: {e}"


# === 2. Recording Configuration ===
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000  # Standard for speech models (Whisper)
MAX_RECORD_DURATION = 30 # Maximum recording length in seconds

# === 3. Tkinter GUI Application ===
class AudioRecorderApp:
    def __init__(self, master):
        self.master = master
        
        # 1. Set application title (window title)
        master.title(APP_TITLE)
        
        # 2. Set the application name for the OS/taskbar
        # This is cross-platform attempt to set the application name
        try:
            # For macOS and some X11 environments
            self.master.tk.call('wm', 'iconname', self.master._w, APP_TITLE)
        except tk.TclError:
            # Standard method, usually works on Windows/Linux
            self.master.wm_iconname(APP_TITLE)
            
        master.geometry("600x450") # Slightly larger window
        master.config(bg="#121212") # Set dark background for root

        # --- TKINTER WIDGET STYLES (ttk) ---
        style = ttk.Style()
        style.theme_use('default') 

        # Configure the dark background for the Notebook tabs
        style.configure('TNotebook', background='#121212', borderwidth=0)
        style.configure('TNotebook.Tab', background='#1E1E1E', foreground='white', borderwidth=0)
        style.map('TNotebook.Tab', background=[('selected', '#0F0F0F')], foreground=[('selected', 'white')])

        # 1. Define new style for dark gray buttons
        style.configure('Dark.TButton',
                        background='#333333',    
                        foreground='white',     
                        font=('Arial', 14),
                        bordercolor='#333333',
                        borderwidth=0,
                        focuscolor='#333333',
                        padding=(20, 10, 20, 10) 
                       )
        
        # 2. Define button appearance in different states (active/disabled)
        style.map('Dark.TButton',
                  background=[('active', '#555555'), # Lighter gray for hover/active state
                              ('disabled', '#333333')], # Disabled state uses the default background
                 )

        logging.info("GUI initialization started.")

        # Initialize PyAudio
        try:
            self.p = pyaudio.PyAudio()
        except Exception as e:
            logging.critical(f"Could not initialize PyAudio: {e}. Destroying GUI.")
            messagebox.showerror("PyAudio Error", f"Could not initialize PyAudio: {e}\nDo you have 'portaudio' installed?")
            master.destroy()
            return
            
        self.frames = []
        self.stream = None
        self.recording = False
        self.start_time = None
        self.record_timer_id = None 
        self.current_wav_filename = None  # Store current recording filename
        self.recording_date = None  # Store recording date

        # Queue for inter-thread communication
        self.transcription_queue = queue.Queue()
        
        # --- TAB MENU SETUP (Notebook) ---
        self.notebook = ttk.Notebook(master, style='TNotebook')
        self.notebook.pack(pady=10, padx=10, fill='both', expand=True)

        # 1. Transcriber Tab
        self.transcriber_frame = tk.Frame(self.notebook, bg="#121212") # Set dark background for frame
        self.notebook.add(self.transcriber_frame, text='Transcriber')

        # 2. History Tab
        self.history_frame = tk.Frame(self.notebook, bg="#121212") # Consistent dark background
        self.notebook.add(self.history_frame, text='Transcription History')
        
        # Create two-panel layout using PanedWindow
        self.history_paned = tk.PanedWindow(self.history_frame, orient=tk.HORIZONTAL, bg="#121212", sashwidth=5, sashrelief=tk.RAISED)
        self.history_paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left Panel: List of transcriptions
        left_panel = tk.Frame(self.history_paned, bg="#121212")
        self.history_paned.add(left_panel, minsize=300)
        
        tk.Label(left_panel, text="Transcription List", font=('Arial', 14, 'bold'), fg='white', bg="#121212").pack(pady=(5, 10))
        
        # Scrollable list frame
        list_container = tk.Frame(left_panel, bg="#121212")
        list_container.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Scrollbar for list
        list_scrollbar = tk.Scrollbar(list_container)
        list_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Canvas for scrolling
        self.history_list_canvas = tk.Canvas(list_container, bg="#1E1E1E", yscrollcommand=list_scrollbar.set, highlightthickness=0)
        list_scrollbar.config(command=self.history_list_canvas.yview)
        self.history_list_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Frame inside canvas for items
        self.history_list_frame = tk.Frame(self.history_list_canvas, bg="#1E1E1E")
        self.history_list_canvas_window = self.history_list_canvas.create_window((0, 0), window=self.history_list_frame, anchor="nw")
        
        # Bind canvas resize
        self.history_list_canvas.bind('<Configure>', self._on_canvas_configure)
        self.history_list_frame.bind('<Configure>', self._on_frame_configure)
        
        # Right Panel: Full transcription text
        right_panel = tk.Frame(self.history_paned, bg="#121212")
        self.history_paned.add(right_panel, minsize=300)
        
        tk.Label(right_panel, text="Transcription Text", font=('Arial', 14, 'bold'), fg='white', bg="#121212").pack(pady=(5, 10))
        
        self.history_display = tk.Text(right_panel, 
                                       wrap=tk.WORD, 
                                       font=('Arial', 11),
                                       relief=tk.SUNKEN, 
                                       bg='#1E1E1E', 
                                       fg='white', 
                                       insertbackground='white', 
                                       state=tk.DISABLED 
                                      )
        self.history_display.pack(pady=5, padx=10, fill=tk.BOTH, expand=True)
        
        # Store currently selected transcription
        self.selected_transcription = None
        self.currently_playing = None  # Track currently playing audio
        self.play_buttons = {}  # Store play/stop button references by wav_file path
        
        # Load transcriptions on init
        self.load_transcription_history()


        # 3. Settings Tab
        self.settings_frame = tk.Frame(self.notebook, bg="#121212") 
        self.notebook.add(self.settings_frame, text='Settings')

        # Content for Settings Tab
        tk.Label(self.settings_frame, text="Under construction...", font=('Arial', 18), fg='gray', bg="#121212").pack(pady=50)


        # --- Transcriber Tab Elements ---
        
        # Record Button
        self.record_button = ttk.Button(self.transcriber_frame, 
                                        text="Record", 
                                        command=self.toggle_recording, 
                                        style='Dark.TButton')
        self.record_button.pack(pady=20, fill=tk.X, padx=20) 

        # Transcribed Text Display (Read-only Text widget)
        self.transcription_display = tk.Text(self.transcriber_frame, 
                                             height=10, 
                                             wrap=tk.WORD, 
                                             font=('Arial', 11),
                                             relief=tk.SUNKEN, 
                                             bg='#1E1E1E', 
                                             fg='white', 
                                             insertbackground='white', 
                                             state=tk.DISABLED 
                                             )
        self.transcription_display.pack(pady=10, padx=20, fill=tk.BOTH, expand=True)
        
        # Initial text insertion for tk.Text
        self.transcription_display.config(state=tk.NORMAL)
        self.transcription_display.insert(tk.END, "Transcribed text will appear here. Select it to copy.")
        self.transcription_display.config(state=tk.DISABLED)


        # Exit Button
        self.exit_button = ttk.Button(master, 
                                      text="Exit", 
                                      command=self.on_closing,
                                      style='Dark.TButton')
        self.exit_button.pack(pady=10)

        # Handle window closing
        master.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Start the loop checking the queue
        self.master.after(100, self.check_transcription_queue)
        logging.info("GUI initialized successfully.")
    
    def copy_to_clipboard(self, text: str):
        """Copies the given text to the system clipboard."""
        self.master.clipboard_clear()
        self.master.clipboard_append(text)
        logging.info("Transcription copied to clipboard.")

    def toggle_recording(self):
        """Toggles the recording state (start/stop)."""
        if self.recording:
            self.stop_recording()
        else:
            self.start_recording()

    def start_recording(self):
        """Starts the audio recording process."""
        self.recording = True
        self.frames = []
        self.start_time = time.time()
        self.recording_date = datetime.now()  # Store recording start date
        logging.info("Recording started.")
        
        try:
            self.stream = self.p.open(format=FORMAT,
                                     channels=CHANNELS,
                                     rate=RATE,
                                     input=True,
                                     frames_per_buffer=CHUNK)

            # Update button text to show status
            self.record_button.config(text="Stop Recording") 
            
            # Update text display
            self.transcription_display.config(state=tk.NORMAL)
            self.transcription_display.delete('1.0', tk.END)
            self.transcription_display.insert(tk.END, "Recording in progress... (max 30s)")
            self.transcription_display.config(state=tk.DISABLED)
            
            self.read_chunk()
            # Set a timer for automatic stop
            self.record_timer_id = self.master.after(MAX_RECORD_DURATION * 1000, self.auto_stop_recording)

        except Exception as e:
            self.recording = False
            self.record_button.config(text="Record", state=tk.NORMAL) 
            logging.error(f"Microphone stream error on start: {e}")
            messagebox.showerror("Audio Error", f"Could not open microphone stream: {e}\nCheck your microphone connection and permissions.")
            if self.record_timer_id:
                self.master.after_cancel(self.record_timer_id)
                self.record_timer_id = None
            
    def read_chunk(self):
        """Reads one audio chunk and schedules the next call."""
        if self.recording:
            try:
                data = self.stream.read(CHUNK, exception_on_overflow=False)
                self.frames.append(data)
                self.master.after(1, self.read_chunk) 
            except IOError as e:
                logging.error(f"Stream read IOError: {e}")
                self.stop_recording()

    def auto_stop_recording(self):
        """Automatically stops recording after MAX_RECORD_DURATION expires."""
        if self.recording:
            logging.info(f"Automatic stop triggered after {MAX_RECORD_DURATION} seconds.")
            self.stop_recording()
            messagebox.showinfo("Recording Finished", f"The recording was stopped automatically after {MAX_RECORD_DURATION} seconds. Starting transcription...")

    def stop_recording(self):
        """Stops the stream, saves the file, and starts the transcription thread."""
        if not self.recording:
            return

        self.recording = False
        
        if self.record_timer_id:
            self.master.after_cancel(self.record_timer_id)
            self.record_timer_id = None

        # Stop and close the stream
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None
        logging.info("Audio stream closed.")

        WAVE_OUTPUT_FILENAME = output_filename()
        self.current_wav_filename = WAVE_OUTPUT_FILENAME  # Store filename for JSON saving
        
        # Update button status for user feedback
        self.record_button.config(text="Saving...", state=tk.DISABLED) 
        self.master.update_idletasks()

        # Save to WAVE file
        try:
            with wave.open(WAVE_OUTPUT_FILENAME, 'wb') as wf:
                wf.setnchannels(CHANNELS)
                wf.setsampwidth(self.p.get_sample_size(FORMAT))
                wf.setframerate(RATE)
                wf.writeframes(b''.join(self.frames))
            logging.info(f"File saved successfully to {WAVE_OUTPUT_FILENAME}")
            
            self.record_button.config(text="Transcribing...")
            
            # Update text in read-only Text widget
            self.transcription_display.config(state=tk.NORMAL)
            self.transcription_display.delete('1.0', tk.END)
            self.transcription_display.insert(tk.END, "Transcription in progress (this may take a while)...")
            self.transcription_display.config(state=tk.DISABLED)
            
            # === START TRANSCRIPTION IN A THREAD ===
            transcription_thread = threading.Thread(
                target=self.run_transcription,
                args=(WAVE_OUTPUT_FILENAME,),
                daemon=True
            )
            transcription_thread.start()
            logging.info("Transcription thread started.")

        except Exception as e:
            messagebox.showerror("Save Error", f"Failed to save WAVE file: {e}")
            self.record_button.config(text="Record", state=tk.NORMAL) 
            logging.error(f"Error saving wave file: {e}", exc_info=True)

    def run_transcription(self, audio_path):
        """
        Method executed in a separate thread. 
        Calls transcription and puts the result in the queue.
        """
        logging.info(f"Running transcription for {audio_path} in thread: {threading.get_ident()}")
        transcription = transcribe_audio(audio_path, MODEL_NAME)
        self.transcription_queue.put(transcription)

    def check_transcription_queue(self):
        """
        Checks the queue for transcription results.
        Run in the main GUI thread.
        """
        try:
            result = self.transcription_queue.get(block=False)
            
            # 1. Update Transcriber tab (main output)
            self.transcription_display.config(state=tk.NORMAL)
            self.transcription_display.delete('1.0', tk.END)
            self.transcription_display.insert(tk.END, result)
            self.transcription_display.config(state=tk.DISABLED)
            
            if "ERROR" in result:
                logging.warning("Transcription failed with error message.")
                messagebox.showerror("Transcription Failed", "Transcription returned an error. Check logs for details.")
            else:
                # Copy to clipboard upon successful transcription
                self.copy_to_clipboard(result)
                
                # Save transcription metadata to JSON file
                if self.current_wav_filename and self.recording_date:
                    save_transcription_metadata(
                        self.current_wav_filename, 
                        result, 
                        self.recording_date
                    )
                    # Reload history list to show new transcription
                    self.load_transcription_history()
                
            self.record_button.config(text="Record", state=tk.NORMAL) # Return to normal state
            # Clear stored filename and date after processing
            self.current_wav_filename = None
            self.recording_date = None

        except queue.Empty:
            pass
        finally:
            self.master.after(100, self.check_transcription_queue)

    def _on_canvas_configure(self, event):
        """Update scroll region when canvas is configured."""
        self.history_list_canvas.configure(scrollregion=self.history_list_canvas.bbox("all"))
        # Update canvas window width
        canvas_width = event.width
        self.history_list_canvas.itemconfig(self.history_list_canvas_window, width=canvas_width)
    
    def _on_frame_configure(self, event):
        """Update scroll region when frame is configured."""
        self.history_list_canvas.configure(scrollregion=self.history_list_canvas.bbox("all"))
    
    def load_transcription_history(self):
        """Loads all transcription JSON files and displays them in the list."""
        # Clear existing items
        for widget in self.history_list_frame.winfo_children():
            widget.destroy()
        
        # Clear play buttons dictionary
        self.play_buttons = {}
        
        # Find all JSON files in output directory
        json_files = glob.glob("output/recording-*.json")
        # Sort by modification time, newest first
        json_files.sort(key=os.path.getmtime, reverse=True)
        
        if not json_files:
            no_items_label = tk.Label(
                self.history_list_frame,
                text="No transcriptions yet",
                font=('Arial', 11),
                fg='gray',
                bg='#1E1E1E',
                anchor='w',
                padx=10,
                pady=20
            )
            no_items_label.pack(fill=tk.X)
            return
        
        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                transcription_text = data.get('transcription', '')
                filename = data.get('filename', os.path.basename(json_file))
                date_str = data.get('date', '')
                
                # Get first words (first 50 characters)
                preview = transcription_text[:50] + "..." if len(transcription_text) > 50 else transcription_text
                if not preview.strip():
                    preview = "(Empty transcription)"
                
                # Create item frame
                item_frame = tk.Frame(self.history_list_frame, bg="#2E2E2E", relief=tk.RAISED, bd=1)
                item_frame.pack(fill=tk.X, padx=5, pady=3)
                
                # Text preview (clickable)
                text_label = tk.Label(
                    item_frame,
                    text=preview,
                    font=('Arial', 10),
                    fg='white',
                    bg='#2E2E2E',
                    anchor='w',
                    justify='left',
                    padx=10,
                    pady=8,
                    cursor='hand2',
                    wraplength=200
                )
                text_label.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
                
                # Store full data in label for click handler
                text_label.transcription_data = {
                    'json_file': json_file,
                    'wav_file': json_file.replace('.json', '.wav'),
                    'transcription': transcription_text,
                    'filename': filename,
                    'date': date_str
                }
                text_label.bind('<Button-1>', lambda e, data=text_label.transcription_data: self.show_transcription(data))
                
                # Button frame
                button_frame = tk.Frame(item_frame, bg="#2E2E2E")
                button_frame.pack(side=tk.RIGHT, padx=5)
                
                wav_file = text_label.transcription_data['wav_file']
                is_currently_playing = (self.currently_playing == wav_file)
                
                # Play/Stop button
                play_btn = tk.Button(
                    button_frame,
                    text="⏸" if is_currently_playing else "▶",
                    font=('Arial', 10),
                    bg='#FF9800' if is_currently_playing else '#4CAF50',
                    fg='white',
                    relief=tk.RAISED,
                    bd=2,
                    padx=8,
                    pady=5,
                    cursor='hand2',
                    command=lambda wav=wav_file: self.toggle_audio_playback(wav)
                )
                play_btn.pack(side=tk.LEFT, padx=2)
                
                # Store button reference for later updates
                self.play_buttons[wav_file] = play_btn
                
                # Delete button
                delete_btn = tk.Button(
                    button_frame,
                    text="✕",
                    font=('Arial', 10, 'bold'),
                    bg='#F44336',
                    fg='white',
                    relief=tk.RAISED,
                    bd=2,
                    padx=8,
                    pady=5,
                    cursor='hand2',
                    command=lambda json_file=json_file, wav_file=text_label.transcription_data['wav_file']: self.delete_transcription(json_file, wav_file)
                )
                delete_btn.pack(side=tk.LEFT, padx=2)
                
                # Hover effects
                def on_enter(event):
                    item_frame.config(bg="#3E3E3E")
                    text_label.config(bg="#3E3E3E")
                    button_frame.config(bg="#3E3E3E")
                
                def on_leave(event):
                    item_frame.config(bg="#2E2E2E")
                    text_label.config(bg="#2E2E2E")
                    button_frame.config(bg="#2E2E2E")
                
                item_frame.bind("<Enter>", on_enter)
                item_frame.bind("<Leave>", on_leave)
                text_label.bind("<Enter>", on_enter)
                text_label.bind("<Leave>", on_leave)
                
            except Exception as e:
                logging.error(f"Error loading transcription {json_file}: {e}", exc_info=True)
        
        # Update scroll region
        self.history_list_frame.update_idletasks()
        self.history_list_canvas.configure(scrollregion=self.history_list_canvas.bbox("all"))
    
    def show_transcription(self, data):
        """Displays the full transcription text in the right panel."""
        self.selected_transcription = data
        self.history_display.config(state=tk.NORMAL)
        self.history_display.delete('1.0', tk.END)
        self.history_display.insert(tk.END, data['transcription'])
        self.history_display.config(state=tk.DISABLED)
        logging.info(f"Displayed transcription from {data['filename']}")
    
    def toggle_audio_playback(self, wav_file: str):
        """Toggles audio playback - plays if stopped, stops if playing."""
        if self.currently_playing == wav_file:
            # Currently playing this file - stop it
            self.stop_audio()
        else:
            # Not playing or playing different file - start playing this one
            self.play_audio(wav_file)
    
    def stop_audio(self):
        """Stops the currently playing audio."""
        if not self.currently_playing:
            return
        
        try:
            if PYGAME_AVAILABLE:
                pygame.mixer.music.stop()
            logging.info(f"Stopped audio playback")
        except Exception as e:
            logging.error(f"Error stopping audio: {e}", exc_info=True)
        finally:
            self.currently_playing = None
            self.update_play_buttons()
    
    def update_play_buttons(self):
        """Updates all play/stop buttons to reflect current playback state."""
        for wav_file, button in self.play_buttons.items():
            if self.currently_playing == wav_file:
                # This file is playing - show stop button
                button.config(text="⏸", bg='#FF9800')
            else:
                # This file is not playing - show play button
                button.config(text="▶", bg='#4CAF50')
    
    def play_audio(self, wav_file: str):
        """Plays the audio file using pygame."""
        if not PYGAME_AVAILABLE:
            messagebox.showwarning("Audio Playback", "pygame is not installed. Install it with: pip install pygame")
            return
        
        if not os.path.exists(wav_file):
            messagebox.showerror("Error", f"Audio file not found: {wav_file}")
            logging.error(f"Audio file not found: {wav_file}")
            return
        
        # Stop currently playing audio if any
        if self.currently_playing:
            try:
                if PYGAME_AVAILABLE:
                    pygame.mixer.music.stop()
            except:
                pass
        
        try:
            # Initialize pygame mixer if not already done
            if not pygame.mixer.get_init():
                pygame.mixer.init()
            
            pygame.mixer.music.load(wav_file)
            pygame.mixer.music.play()
            self.currently_playing = wav_file
            logging.info(f"Playing audio: {wav_file}")
            
            # Update play buttons immediately
            self.update_play_buttons()
            
            # Monitor playback in a separate thread
            def monitor_playback():
                while pygame.mixer.music.get_busy() and self.currently_playing == wav_file:
                    time.sleep(0.1)
                # Playback finished or was stopped
                if self.currently_playing == wav_file:
                    self.currently_playing = None
                    # Update buttons in main thread
                    self.master.after(0, self.update_play_buttons)
            
            threading.Thread(target=monitor_playback, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Playback Error", f"Failed to play audio: {e}")
            logging.error(f"Error playing audio {wav_file}: {e}", exc_info=True)
            self.currently_playing = None
            self.update_play_buttons()
    
    def delete_transcription(self, json_file: str, wav_file: str):
        """Deletes both the JSON and WAV files for a transcription."""
        response = messagebox.askyesno(
            "Delete Transcription",
            f"Are you sure you want to delete this transcription?\n\nFile: {os.path.basename(json_file)}"
        )
        
        if not response:
            return
        
        try:
            # Delete JSON file
            if os.path.exists(json_file):
                os.remove(json_file)
                logging.info(f"Deleted JSON file: {json_file}")
            
            # Delete WAV file
            if os.path.exists(wav_file):
                # Stop playback if this file is currently playing
                if self.currently_playing == wav_file:
                    self.stop_audio()
                # Remove button reference
                if wav_file in self.play_buttons:
                    del self.play_buttons[wav_file]
                os.remove(wav_file)
                logging.info(f"Deleted WAV file: {wav_file}")
            
            # If this was the selected transcription, clear the display
            if self.selected_transcription and self.selected_transcription.get('json_file') == json_file:
                self.history_display.config(state=tk.NORMAL)
                self.history_display.delete('1.0', tk.END)
                self.history_display.config(state=tk.DISABLED)
                self.selected_transcription = None
            
            # Reload the list
            self.load_transcription_history()
            
            messagebox.showinfo("Success", "Transcription deleted successfully.")
            
        except Exception as e:
            messagebox.showerror("Delete Error", f"Failed to delete transcription: {e}")
            logging.error(f"Error deleting transcription {json_file}: {e}", exc_info=True)
    
    def on_closing(self):
        """Handles clean application shutdown."""
        logging.info("Closing application...")
        if self.recording:
            self.stop_recording()
        
        # Stop audio playback if any
        if self.currently_playing and PYGAME_AVAILABLE:
            try:
                pygame.mixer.music.stop()
            except:
                pass
        
        # Terminate PyAudio
        if self.p:
            self.p.terminate()
        
        self.master.destroy()
        logging.info("Application destroyed.")

# --- Application Startup ---
if __name__ == "__main__":
    logging.info("Whisper model loading might take a moment on first launch...")
    root = tk.Tk()
    app = AudioRecorderApp(root)
    root.mainloop()
