from assistant import select_assistant
from cli import console
from session.chat_session import ChatSession


def switch_assistant_command(session: ChatSession):
    new_assistant = select_assistant()
    session.switch_assistant(new_assistant)
    console.print_info(f"Asystent zmieniony na: {new_assistant.name}")
