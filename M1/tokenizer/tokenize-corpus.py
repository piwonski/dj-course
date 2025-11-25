import argparse
import os
import sys
from pathlib import Path

import matplotlib.pyplot as plt
from tokenizers import Tokenizer

from corpora import get_corpus_file


def render_terminal_bar_chart(sorted_results):
    if not sorted_results:
        return

    max_value = max(count for _, count in sorted_results)
    if not max_value:
        return

    bar_width = 50
    max_label_len = max(len(label) for label, _ in sorted_results)
    print("\nWizualizacja słupkowa")
    for label, value in sorted_results:
        normalized = max(1, int((value / max_value) * bar_width))
        bar = "#" * normalized
        print(f"{label.rjust(max_label_len)} | {bar} {value}")


def save_bar_plot(sorted_results, source_stem, plots_dir: Path):
    if not sorted_results:
        return

    labels = [name for name, _ in sorted_results]
    values = [count for _, count in sorted_results]
    x_positions = list(range(len(labels)))

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(x_positions, values, color="#4e79a7")
    ax.set_title(f"Liczba tokenów ({source_stem})")
    ax.set_ylabel("Liczba tokenów")
    ax.set_xlabel("Tokenizer")
    ax.set_xticks(x_positions)
    ax.set_xticklabels(labels, rotation=45, ha="right")

    for bar, value in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height(),
            f"{value}",
            ha="center",
            va="bottom",
        )

    fig.tight_layout()
    plot_path = plots_dir / f"tokenized-{source_stem}-tokenizers.png"
    fig.savefig(plot_path, dpi=150)
    plt.close(fig)
    print(f"Wykres zapisany w: {plot_path}")

TOKENIZERS = {
    "bielik-v1": "tokenizers/bielik-v1-tokenizer.json",
    "bielik-v2": "tokenizers/bielik-v2-tokenizer.json",
    "bielik-v3": "tokenizers/bielik-v3-tokenizer.json",
    "llama-3.3-70b": "tokenizers/tokenizer-llama-3.3-70b.json",
    "pan-tadeusz": "tokenizers/tokenizer-pan-tadeusz.json",
    "wolnelektury": "tokenizers/tokenizer-wolnelektury.json",
    "nkjp": "tokenizers/tokenizer-nkjp.json",
    "all": "tokenizers/tokenizer-all-corpora.json",
}
TOKENIZER = "bielik-v3"

parser = argparse.ArgumentParser(
    description="Tokenizuje wskazany plik z korpusu lub dowolną ścieżkę i zapisuje statystyki."
)
source_group = parser.add_mutually_exclusive_group(required=True)
source_group.add_argument(
    "-c",
    "--corpus",
    help="Nazwa pliku lub wzorca (np. 'pan-tadeusz-ksiega-1.txt') z korpusu WOLNELEKTURY.",
)
source_group.add_argument(
    "-p",
    "--path",
    help="Ścieżka (względna lub bezwzględna) do pliku tekstowego do tokenizacji.",
)

if len(sys.argv) == 1:
    parser.print_help()
    sys.exit(0)

args = parser.parse_args()

if args.path:
    source_file = Path(args.path).expanduser().resolve()
    if not source_file.exists():
        raise FileNotFoundError(f"Nie znaleziono pliku: {source_file}")
else:
    matched_files = get_corpus_file("WOLNELEKTURY", args.corpus)
    if not matched_files:
        raise ValueError(
            f"Nie znaleziono plików pasujących do wzorca: {args.corpus}"
        )
    source_file = Path(matched_files[0])

print(f"Source file: {source_file}")

with source_file.open("r", encoding="utf-8") as f:
    source_txt = f.read()

logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)
plots_dir = Path("plots")
plots_dir.mkdir(exist_ok=True)

results = []
for tokenizer_name, tokenizer_path in TOKENIZERS.items():
    tokenizer = Tokenizer.from_file(tokenizer_path)
    encoded = tokenizer.encode(source_txt)
    token_count = len(encoded.ids)
    log_file_name = logs_dir / f"tokenized-{source_file.stem}-{tokenizer_name}.log"

    with log_file_name.open('w', encoding='utf-8') as f:
        f.write(f"Liczba tokenów: {token_count}\n")
        f.write(f"Tokenizer: {tokenizer_name}\n")

    results.append((tokenizer_name, token_count))

sorted_results = sorted(results, key=lambda item: item[1])

render_terminal_bar_chart(sorted_results)
save_bar_plot(sorted_results, source_file.stem, plots_dir)