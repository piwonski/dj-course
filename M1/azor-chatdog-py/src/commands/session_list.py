from files import session_files
from cli import console

def list_sessions_command():
    """Displays a formatted list of available sessions."""
    sessions = session_files.list_sessions()
    if sessions:
        console.print_help("\n--- Dostępne zapisane sesje ---")
        for session in sessions:
            if session.get('error'):
                console.print_error(f"- ID: {session['id']} ({session['error']})")
            else:
                title = session['title'] if session.get('title') else '(brak tytułu)'
                console.print_help(f"- {title} (Wiadomości: {session['messages_count']}, Ost. aktywność: {session['last_activity']}) | {session['id']}")
        console.print_help("-------------------------------")
    else:
        console.print_help("\nBrak zapisanych sesji.")
