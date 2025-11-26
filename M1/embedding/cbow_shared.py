"""
Wspólne stałe używane przez skrypty treningowe i weryfikujące Word2Vec (CBOW).
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

OUTPUT_TENSOR_FILE = "embedding_tensor_cbow.npy"
OUTPUT_MAP_FILE = "embedding_token_to_index_map.json"
OUTPUT_MODEL_FILE = "embedding_word2vec_cbow_model.model"

#
# Parametry treningu Word2Vec / CBOW / Skip-gram
#

VECTOR_LENGTH = 20
WINDOW_SIZE = 6
MIN_COUNT = 2          # minimalna liczba wystąpień tokenu
WORKERS = 4            # liczba wątków
EPOCHS = 20            # liczba epok
SAMPLE_RATE = 1e-2     # subsampling częstych słów
SG_MODE = 0            # 0 dla CBOW, 1 dla Skip-gram


