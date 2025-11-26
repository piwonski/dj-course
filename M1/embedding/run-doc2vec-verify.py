import numpy as np
import json
import logging
import os
from datetime import datetime

from gensim.models.doc2vec import Doc2Vec
from tokenizers import Tokenizer
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


def _create_log_file() -> tuple[str, "os.TextIOWrapper"]:
    """
    Tworzy plik logów z timestampem w nazwie i zwraca (ścieżka, uchwyt).
    Przykład nazwy: logs/doc2vec_verify_20251126_143522.log
    """
    logs_dir = "logs"
    os.makedirs(logs_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"doc2vec_verify_{timestamp}.log"
    path = os.path.join(logs_dir, filename)
    f = open(path, "w", encoding="utf-8")
    return path, f


log_path, _log_fp = _create_log_file()


def log_to_file(line: str) -> None:
    """
    Zapisuje linię tylko do pliku logów (bez wypisywania na stdout).
    """
    _log_fp.write(line + "\n")


try:
    print(f"Ładowanie tokenizera z pliku: {TOKENIZER_FILE}")
    tokenizer = Tokenizer.from_file(TOKENIZER_FILE)
except FileNotFoundError:
    print(f"BŁĄD: Nie znaleziono pliku '{TOKENIZER_FILE}'. Upewnij się, że plik istnieje.")
    _log_fp.close()
    raise

try:
    print(f"Ładowanie wytrenowanego modelu Doc2Vec: {OUTPUT_MODEL_FILE}")
    loaded_model = Doc2Vec.load(OUTPUT_MODEL_FILE)
except FileNotFoundError:
    print(f"BŁĄD: Plik modelu '{OUTPUT_MODEL_FILE}' nie istnieje. Uruchom najpierw skrypt treningowy.")
    _log_fp.close()
    raise

try:
    print(f"Ładowanie mapy zdań: {OUTPUT_SENTENCE_MAP}")
    with open(OUTPUT_SENTENCE_MAP, "r", encoding="utf-8") as f:
        sentence_lookup = json.load(f)
except FileNotFoundError:
    print(f"BŁĄD: Plik mapy zdań '{OUTPUT_SENTENCE_MAP}' nie istnieje. Uruchom najpierw skrypt treningowy.")
    _log_fp.close()
    raise

# --- LOGOWANIE PARAMETRÓW TRENINGU ---

print("\n--- Parametry treningu Doc2Vec ---")
print(f"TOKENIZER_FILE = {TOKENIZER_FILE}")
print(f"VECTOR_LENGTH  = {VECTOR_LENGTH}")
print(f"WINDOW_SIZE    = {WINDOW_SIZE}")
print(f"MIN_COUNT      = {MIN_COUNT}")
print(f"WORKERS        = {WORKERS}")
print(f"EPOCHS         = {EPOCHS}")
print(f"DM_MODE        = {DM_MODE}  # 1=PV-DM (Distributed Memory), 0=PV-DBOW (Distributed Bag of Words)")
print(f"(Logi zapisane w pliku: {log_path})")

# Do pliku logów zapisujemy tylko zwięzłą wersję parametrów (odwołanie do doc2vec_shared.py)
log_to_file(f"TOKENIZER_FILE = {TOKENIZER_FILE}")
log_to_file(f"VECTOR_LENGTH = {VECTOR_LENGTH}")
log_to_file(f"WINDOW_SIZE = {WINDOW_SIZE}")
log_to_file(f"MIN_COUNT = {MIN_COUNT}")
log_to_file(f"WORKERS = {WORKERS}")
log_to_file(f"EPOCHS = {EPOCHS}")
log_to_file(f"DM_MODE = {DM_MODE}")
log_to_file("")

try:
    # =========================================================================
    # === ETAP WNIOSKOWANIA (INFERENCE) ===
    # =========================================================================

    print("\n" + "="*50)
    print("=== ROZPOCZYNAM ETAP WNIOSKOWANIA (INFERENCE) ===")
    print("="*50)

    new_sentence = "Jestem głodny."
    print(f"Zdanie do wnioskowania: \"{new_sentence}\"")
    log_to_file(f"Zdanie do wnioskowania: \"{new_sentence}\"")

    # Tokenizacja nowego zdania
    new_tokens = tokenizer.encode(new_sentence).tokens

    # Generowanie wektora dla nowego zdania
    inferred_vector = loaded_model.infer_vector(new_tokens, epochs=loaded_model.epochs)
    print(f"\nWygenerowany wektor (embedding) dla zdania. Kształt: {inferred_vector.shape}")
    log_to_file(f"Wygenerowany wektor (embedding) dla zdania. Kształt: {inferred_vector.shape}")

    # Znajdowanie najbardziej podobnych wektorów z przestrzeni dokumentów/zdań
    most_similar_docs = loaded_model.dv.most_similar([inferred_vector], topn=5)

    header = "\n5 najbardziej podobnych zdań z korpusu (Doc2Vec Inference):"
    print(header)
    log_to_file(header)

    for doc_id_str, similarity in most_similar_docs:
        # Konwertujemy ID (string) z powrotem na indeks (int)
        doc_index = int(doc_id_str)

        # Używamy indeksu do odnalezienia oryginalnego tekstu
        # Zabezpieczenie na wypadek błędu indeksowania (choć nie powinno wystąpić)
        try:
            original_sentence = sentence_lookup[doc_index]
            line = f"  - Sim: {similarity:.4f} | Zdanie (ID: {doc_id_str}): {original_sentence}"
            print(line)
            log_to_file(line)
        except IndexError:
            line = f"  - Sim: {similarity:.4f} | BŁĄD: Nie znaleziono zdania dla ID: {doc_id_str}"
            print(line)
            log_to_file(line)

    print("\n=== ETAP WNIOSKOWANIA ZAKOŃCZONY ===")
    log_to_file("\n=== ETAP WNIOSKOWANIA ZAKOŃCZONY ===")

finally:
    _log_fp.close()

