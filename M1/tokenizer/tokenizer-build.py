import argparse
import sys
from pathlib import Path
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace
from corpora import CORPORA_FILES, get_corpus_file

TOKENIZER_DIR = Path("tokenizers")

# 1. Initialize the Tokenizer (BPE model)
tokenizer = Tokenizer(BPE(unk_token="[UNK]")) 

# 2. Set the pre-tokenizer (e.g., split on spaces)
tokenizer.pre_tokenizer = Whitespace()

# 3. Set the Trainer
trainer = BpeTrainer(
    special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]", "[MASK]"],
    vocab_size=32000,
    min_frequency=2
)


parser = argparse.ArgumentParser()
parser.add_argument(
    "-o",
    "--output",
    help="Nazwa pliku wyjściowego tokenizera (zostanie zapisana w katalogu tokenizers)",
)
AVAILABLE_CORPORA = sorted(CORPORA_FILES.keys())
parser.add_argument(
    "-c",
    "--corpus",
    choices=AVAILABLE_CORPORA,
    help=f"Nazwa korpusu do trenowania (jedna z: {', '.join(AVAILABLE_CORPORA)})",
)
if len(sys.argv) == 1:
    parser.print_help()
    sys.exit(0)
args = parser.parse_args()

tokenizer_output_file = TOKENIZER_DIR / (args.output or "alpha_tokenizer.json")

FILES = []

if args.corpus:
    FILES.extend(str(f) for f in CORPORA_FILES[args.corpus])

cli_files = args.files

if cli_files:
    # jeśli podane są pliki lub nazwy korpusów, to użyj ich
    for fname in cli_files:
        if fname in CORPORA_FILES:
            matched = CORPORA_FILES[fname]
        else:
            # Dla każdego podanego pliku: wybierz z korpusu "WOLNELEKTURY" listę plików pasujących do tej nazwy
            # obsłuż zarówno wildcardy (np. "*.txt"), jak i zwykłą nazwę pliku
            matched = get_corpus_file("WOLNELEKTURY", fname)
        FILES.extend([str(f) for f in matched])

if not FILES:
    raise ValueError(
        "Nie znaleziono plików dla podanych argumentów "
        f"(korpus: {args.corpus}, pozostałe: {cli_files})"
    )

print("FILES length:", len(FILES))


# 4. Train the Tokenizer
tokenizer.train(FILES, trainer=trainer)

# 5. Save the vocabulary and tokenization rules
TOKENIZER_DIR.mkdir(parents=True, exist_ok=True)
tokenizer.save(str(tokenizer_output_file))

for txt in [
    "Litwo! Ojczyzno moja! ty jesteś jak zdrowie.",
    "Jakże mi wesoło!",
    "Jeśli wolisz mieć pełną kontrolę nad tym, które listy są łączone (a to jest bezpieczniejsze, gdy słownik może zawierać inne klucze), po prostu prześlij listę list do spłaszczenia.",
]:
    encoded = tokenizer.encode(txt)
    print("Zakodowany tekst:", encoded.tokens)
    print("ID tokenów:", encoded.ids)
