from colorama import Fore, Style
from prompt_toolkit import prompt
from prompt_toolkit.application import get_app
from prompt_toolkit.completion import WordCompleter
from prompt_toolkit.styles import Style as PTStyle

from .assistent import Assistant
from .azor import create_azor_assistant
from .poet import create_poet_assistant
from .businessman import create_businessman_assistant


DEFAULT_ASSISTANT_NAME = "AZOR"

_ASSISTANTS: dict[str, tuple[str, callable]] = {
    "AZOR":       ("Przyjacielski pies, najlepszy przyjaciel Reksia",         create_azor_assistant),
    "POET":       ("Barwny i opisowy, odpowiada pięknym, poetyckim językiem", create_poet_assistant),
    "BUSINESSMAN":("Rzeczowy i konkretny, zorientowany na cele",              create_businessman_assistant),
}

ASSISTANT_NAMES = list(_ASSISTANTS.keys())

_completer = WordCompleter(ASSISTANT_NAMES, ignore_case=True, sentence=True)

_style = PTStyle.from_dict({
    'completion-menu.completion':         'bg:#1a1a2e #aaaaaa',
    'completion-menu.completion.current': 'bg:#0f3460 #ffffff bold',
})


def select_assistant() -> Assistant:
    print(Fore.YELLOW + "\nDostępni asystenci:" + Style.RESET_ALL)
    for name, (desc, _) in _ASSISTANTS.items():
        print(Fore.YELLOW + f"  {name:<12} - {desc}" + Style.RESET_ALL)
    print()

    while True:
        try:
            choice = prompt(
                "Wybierz asystenta: ",
                completer=_completer,
                complete_while_typing=True,
                style=_style,
                pre_run=lambda: get_app().current_buffer.start_completion(select_first=True),
            ).strip().upper()
        except (KeyboardInterrupt, EOFError):
            choice = "AZOR"

        if choice in _ASSISTANTS:
            _, factory = _ASSISTANTS[choice]
            return factory()

        print(Fore.RED + f"Nieznany asystent '{choice}'. Wybierz spośród: {', '.join(_ASSISTANTS)}." + Style.RESET_ALL)
