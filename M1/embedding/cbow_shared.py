"""
Wspólne stałe używane przez skrypty treningowe i weryfikujące Word2Vec (CBOW).
"""

# TOKENIZER_FILE = "../tokenizer/tokenizers/custom_bpe_tokenizer.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v1-tokenizer.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-llama-3.3-70b.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-pan-tadeusz.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-wolnelektury.json"
TOKENIZER_FILE = "../tokenizer/tokenizers/tokenizer-all-corpora.json"
# TOKENIZER_FILE = "../tokenizer/tokenizers/bielik-v3-tokenizer.json"

OUTPUT_TENSOR_FILE = "embedding_tensor_cbow.npy"
OUTPUT_MAP_FILE = "embedding_token_to_index_map.json"
OUTPUT_MODEL_FILE = "embedding_word2vec_cbow_model.model"

MIN_COUNT = 2  # pozostawione dla logów / diagnostyki

