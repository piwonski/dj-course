import json
import shutil
from pathlib import Path

from mcp.server.fastmcp import FastMCP

LOG_DIR = Path.home() / ".azor"
TRASH_DIR = LOG_DIR / ".trash"

mcp = FastMCP("azor-session-manager")


@mcp.tool()
def list_sessions() -> list[dict]:
    """Lists all Azor conversation sessions with metadata."""
    sessions = []
    for path in sorted(LOG_DIR.glob("*-log.json")):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            history = data.get("history", [])
            last_ts = history[-1]["timestamp"] if history else None
            sessions.append({
                "session_id": data["session_id"],
                "title": data.get("title"),
                "model": data.get("model"),
                "message_count": len(history),
                "updated_at": last_ts,
            })
        except Exception as e:
            sessions.append({
                "session_id": path.stem.replace("-log", ""),
                "error": str(e),
            })
    return sessions


@mcp.tool()
def get_session(session_id: str) -> dict:
    """Returns full metadata and conversation history for a given session."""
    path = LOG_DIR / f"{session_id}-log.json"
    if not path.exists():
        return {"error": f"Session '{session_id}' not found."}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@mcp.tool()
def delete_sessions(session_ids: list[str]) -> dict:
    """Moves selected sessions to trash (~/.azor/.trash). Returns which were moved and which were not found."""
    TRASH_DIR.mkdir(exist_ok=True)
    moved = []
    not_found = []
    for sid in session_ids:
        src = LOG_DIR / f"{sid}-log.json"
        if not src.exists():
            not_found.append(sid)
            continue
        shutil.move(str(src), str(TRASH_DIR / src.name))
        moved.append(sid)
    return {"moved": moved, "not_found": not_found}


if __name__ == "__main__":
    mcp.run()
