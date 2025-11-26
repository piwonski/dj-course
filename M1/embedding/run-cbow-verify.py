import numpy as np
import logging
import os
from datetime import datetime

from gensim.models import Word2Vec
from tokenizers import Tokenizer
from cbow_shared import (  # type: ignore
    TOKENIZER_FILE,
    OUTPUT_MODEL_FILE,
    MIN_COUNT,
    VECTOR_LENGTH,
    WINDOW_SIZE,
    WORKERS,
    EPOCHS,
    SAMPLE_RATE,
    SG_MODE,
)

# Ustawienie logowania dla gensim
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

def _create_log_file() -> tuple[str, "os.TextIOWrapper"]:
    """
    Tworzy plik logów z timestampem w nazwie i zwraca (ścieżka, uchwyt).
    Przykład nazwy: logs/cbow_verify_20251126_143522.log
    """
    logs_dir = "logs"
    os.makedirs(logs_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"cbow_verify_{timestamp}.log"
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
    print(f"Ładowanie wytrenowanego modelu Word2Vec: {OUTPUT_MODEL_FILE}")
    model = Word2Vec.load(OUTPUT_MODEL_FILE)
except FileNotFoundError:
    print(f"BŁĄD: Plik modelu '{OUTPUT_MODEL_FILE}' nie istnieje. Uruchom najpierw skrypt treningowy.")
    _log_fp.close()
    raise

# --- LOGOWANIE PARAMETRÓW TRENINGU ---

print("\n--- Parametry treningu Word2Vec ---")
print(f"TOKENIZER_FILE = {TOKENIZER_FILE}")
print(f"VECTOR_LENGTH = {VECTOR_LENGTH}")
print(f"WINDOW_SIZE   = {WINDOW_SIZE}")
print(f"MIN_COUNT     = {MIN_COUNT}")
print(f"WORKERS       = {WORKERS}")
print(f"EPOCHS        = {EPOCHS}")
print(f"SAMPLE_RATE   = {SAMPLE_RATE}")
print(f"SG_MODE       = {SG_MODE}  # 0=CBOW, 1=Skip-gram")
print(f"(Logi zapisane w pliku: {log_path})")

# Do pliku logów zapisujemy tylko zwięzłą wersję parametrów (odwołanie do cbow_shared.py)
log_to_file(f"VECTOR_LENGTH = {VECTOR_LENGTH}")
log_to_file(f"WINDOW_SIZE = {WINDOW_SIZE}")
log_to_file(f"MIN_COUNT = {MIN_COUNT}")
log_to_file(f"WORKERS = {WORKERS}")
log_to_file(f"EPOCHS = {EPOCHS}")
log_to_file(f"SAMPLE_RATE = {SAMPLE_RATE}")
log_to_file(f"SG_MODE = {SG_MODE}")

# --- DODANA FUNKCJA: OBLICZANIE WEKTORA DLA CAŁEGO SŁOWA ---

def get_word_vector_and_similar(word: str, tokenizer: Tokenizer, model: Word2Vec, topn: int = 20):
    # Tokenizacja słowa na tokeny podwyrazowe
    # Używamy .encode(), aby otoczyć słowo spacjami, co imituje kontekst w zdaniu
    # Ważne: tokenizator BPE/SentencePiece musi widzieć spację, by dodać prefiks '_'
    encoding = tokenizer.encode(" " + word + " ") 
    word_tokens = [t.strip() for t in encoding.tokens if t.strip()] # Usuń puste tokeny
    
    # Usuwamy tokeny początku/końca sekwencji, jeśli zostały dodane przez tokenizator
    if word_tokens and word_tokens[0] in ['[CLS]', '<s>', '<s>', 'Ġ']:
        word_tokens = word_tokens[1:]
    if word_tokens and word_tokens[-1] in ['[SEP]', '</s>', '</s>']:
        word_tokens = word_tokens[:-1]

    valid_vectors = []
    missing_tokens = []
    
    # 1. Zbieranie wektorów dla każdego tokenu
    for token in word_tokens:
        if token in model.wv:
            # Użycie tokenu ze spacją (np. '_ryż') lub bez (np. 'szlach')
            valid_vectors.append(model.wv[token])
        else:
            # W tym miejscu token może być zbyt rzadki i pominięty przez MIN_COUNT
            missing_tokens.append(token)

    if not valid_vectors:
        # Kod do obsługi, gdy żaden token nie ma wektora
        if missing_tokens:
            print(
                f"BŁĄD: Żaden z tokenów składowych ('{word_tokens}') nie znajduje się w słowniku (MIN_COUNT={MIN_COUNT})."
            )
        else:
            print(f"BŁĄD: Słowo '{word}' nie zostało przetworzone na wektory (sprawdź tokenizację).")
        return None, None

    # 2. Uśrednianie wektorów
    # Wektor dla całego słowa to średnia wektorów jego tokenów składowych
    word_vector = np.mean(valid_vectors, axis=0)

    # 3. Znalezienie najbardziej podobnych tokenów
    similar_words = model.wv.most_similar(
        positive=[word_vector],
        topn=topn
    )
    
    return word_vector, similar_words

try:
    # --- WERYFIKACJA UŻYCIA NOWEJ FUNKCJI ---

    print("\n--- Weryfikacja: Szukanie podobieństw dla całych SŁÓW (uśrednianie wektorów tokenów) ---")

    # Przykłady, które wcześniej mogły nie działać
    words_to_test = ["wojsko", "szlachta", "choroba", "król"]

    for word in words_to_test:
        word_vector, similar_tokens = get_word_vector_and_similar(word, tokenizer, model, topn=10)

        if word_vector is not None:
            header = (
                f"\n10 tokenów najbardziej podobnych do SŁOWA '{word}' "
                f"(uśrednione wektory tokenów {tokenizer.encode(word).tokens}):"
            )
            print(header)
            log_to_file(header)
            # Wyświetlanie wektora (pierwsze 5 elementów)
            vec_line = f"  > Wektor słowa (początek): {word_vector[:5]}..."
            print(vec_line)
            log_to_file(vec_line)
            for token, similarity in similar_tokens:
                line = f"  - {token}: {similarity:.4f}"
                print(line)
                log_to_file(line)

    # --- WERYFIKACJA DLA WZORCA MATEMATYCZNEGO (Analogia wektorowa) ---

    tokens_analogy = ["dziecko", "kobieta"]

    # Używamy uśredniania wektorów dla tokenów
    if tokens_analogy[0] in model.wv and tokens_analogy[1] in model.wv:
        similar_to_combined = model.wv.most_similar(
            positive=tokens_analogy,
            topn=10,
        )

        header = f"\n10 tokenów najbardziej podobnych do kombinacji tokenów: {tokens_analogy}"
        print(header)
        log_to_file(header)
        for token, similarity in similar_to_combined:
            line = f"  - {token}: {similarity:.4f}"
            print(line)
            log_to_file(line)
    else:
        print(
            f"\nOstrzeżenie: Co najmniej jeden z tokenów '{tokens_analogy}' nie znajduje się w słowniku. Pomięto analogię."
        )
finally:
    _log_fp.close()
