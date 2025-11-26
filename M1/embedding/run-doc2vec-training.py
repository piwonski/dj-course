import numpy as np
import json
import logging
import time
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from tokenizers import Tokenizer
from corpora import CORPORA_FILES  # type: ignore
from doc2vec_shared import (  # type: ignore
    TOKENIZER_FILE,
    OUTPUT_MODEL_FILE,
    OUTPUT_SENTENCE_MAP,
    VECTOR_LENGTH,
    WINDOW_SIZE,
    MIN_COUNT,
    WORKERS,
    EPOCHS,
    DM_MODE,
)

# Ustawienie logowania dla gensim
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

# --- KONFIGURACJA ŚCIEŻEK I PARAMETRÓW ---
# files = CORPORA_FILES["ALL"]
files = CORPORA_FILES["WOLNELEKTURY"]
# files = CORPORA_FILES["PAN_TADEUSZ"]

# --- ETAP 1: Wczytanie, Tokenizacja i Przygotowanie Danych ---
try:
    print(f"Ładowanie tokenizera z pliku: {TOKENIZER_FILE}")
    tokenizer = Tokenizer.from_file(TOKENIZER_FILE)
except FileNotFoundError:
    print(f"BŁĄD: Nie znaleziono pliku '{TOKENIZER_FILE}'. Upewnij się, że plik istnieje.")
    raise

# Wczytywanie i agregacja tekstu
raw_sentences = []
print("Wczytywanie tekstu z plików...")
print(f"Liczba plików do wczytania: {len(files)}")

for file in files:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip()]
            raw_sentences.extend(lines)
    except FileNotFoundError:
        print(f"OSTRZEŻENIE: Nie znaleziono pliku '{file}'. Pomijam.")
        continue
    except Exception as e:
        print(f"BŁĄD podczas przetwarzania pliku '{file}': {e}")
        continue

if not raw_sentences:
    print("BŁĄD: Korpus danych jest pusty.")
    raise ValueError("Korpus danych jest pusty.")

print(f"Tokenizacja {len(raw_sentences)} zdań...")

# Konwersja na listę tokenów
tokenized_sentences = [
    tokenizer.encode(sentence).tokens for sentence in raw_sentences
]

# Przygotowanie danych dla Doc2Vec
tagged_data = [
    TaggedDocument(words=tokenized_sentences[i], tags=[str(i)])
    for i in range(len(tokenized_sentences))
]
print(f"Przygotowano {len(tagged_data)} sekwencji TaggedDocument do treningu.")

# --- ETAP 2: Trening Doc2Vec ---
print("\n--- Rozpoczynanie Treningu Doc2Vec ---")
start_time = time.time()
model_d2v = Doc2Vec(
    tagged_data,
    vector_size=VECTOR_LENGTH,
    window=WINDOW_SIZE,
    min_count=MIN_COUNT,
    workers=WORKERS,
    epochs=EPOCHS,
    dm=DM_MODE,  # Distributed Memory (PV-DM) lub Distributed Bag of Words (PV-DBOW)
)
end_time = time.time()
print(f"Trening zakończony pomyślnie. Czas trwania: {end_time - start_time:.2f}s")

# --- ETAP 3: Zapisywanie Wytrenowanego Modelu i Mapy ---
try:
    model_d2v.save(OUTPUT_MODEL_FILE)
    print(f"\nPełny model Doc2Vec zapisany jako: '{OUTPUT_MODEL_FILE}'.")

    with open(OUTPUT_SENTENCE_MAP, "w", encoding="utf-8") as f:
        json.dump(raw_sentences, f, ensure_ascii=False, indent=4)
    print(f"Mapa zdań do ID zapisana jako: '{OUTPUT_SENTENCE_MAP}'.")

except Exception as e:
    print(f"BŁĄD podczas zapisu modelu/mapy: {e}")
    raise

