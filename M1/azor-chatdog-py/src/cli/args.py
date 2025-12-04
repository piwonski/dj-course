import argparse


def parse_cli_args() -> argparse.Namespace:
    """Parses CLI arguments and returns the full namespace.

    Currently supported:
    - --session-id
    - --top-p
    - --top-k
    - --temperature
    """
    parser = argparse.ArgumentParser(description="Interaktywny pies asystent! 🐶")
    parser.add_argument(
        '--session-id',
        type=str,
        default=None,
        help="ID sesji do wczytania i kontynuowania (np. a1b2c3d4-log.json -> a1b2c3d4)"
    )
    parser.add_argument(
        '--top-p',
        type=float,
        default=None,
        help="Parametr top-p dla próbkowania LLaMA (opcjonalny)"
    )
    parser.add_argument(
        '--top-k',
        type=int,
        default=None,
        help="Parametr top-k dla próbkowania LLaMA (opcjonalny)"
    )
    parser.add_argument(
        '--temperature',
        type=float,
        default=None,
        help="Temperatura dla próbkowania LLaMA (opcjonalna)"
    )
    return parser.parse_args()
