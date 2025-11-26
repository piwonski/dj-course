"""
Wspólne stałe używane przez skrypty treningowe i weryfikujące Doc2Vec.
"""

#
# Konfiguracja tokenizera
#

# Przykładowe alternatywy:
# TOKENIZER_FILE = "../tokenizer/tokenizers/custom_bpe_tokenizer.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v1-tokenizer.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-llama-3.3-70b.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-pan-tadeusz.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-wolnelektury.json"
TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-all-corpora.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v3-tokenizer.json"

#
# Ścieżki wyjściowe dla artefaktów embeddingu
#

OUTPUT_MODEL_FILE = "doc2vec_model_combined.model"
OUTPUT_SENTENCE_MAP = "doc2vec_model_sentence_map_combined.json"

#
# Parametry treningu Doc2Vec
#

VECTOR_LENGTH = 40
WINDOW_SIZE = 6
MIN_COUNT = 4          # minimalna liczba wystąpień tokenu
WORKERS = 4            # liczba wątków
EPOCHS = 40            # liczba epok
DM_MODE = 1            # 1 dla Distributed Memory (PV-DM), 0 dla Distributed Bag of Words (PV-DBOW)

