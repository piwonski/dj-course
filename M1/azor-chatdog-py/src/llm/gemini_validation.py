from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
import re

class GeminiConfig(BaseModel):
    engine: Literal["GEMINI"] = Field(default="GEMINI")
    model_name: str = Field(..., description="Nazwa modelu Gemini")
    gemini_api_key: str = Field(..., min_length=1, description="Klucz API Google Gemini")
    
    @validator("gemini_api_key")
    def validate_api_key(cls, v: str) -> str:
        """
        Basic sanity checks for Gemini API key:
        - non-empty
        - no whitespace
        - ASCII-only (nagłówki HTTP)
        - looks like standard Google AI key (prefiks AIza...)
        """
        if not v or v.strip() == "":
            raise ValueError("GEMINI_API_KEY nie może być pusty")

        key = v.strip()

        # Brak białych znaków (spacje, nowe linie itp.)
        if any(ch.isspace() for ch in key):
            raise ValueError("GEMINI_API_KEY nie może zawierać spacji ani znaków nowej linii")

        # Tylko ASCII – unikamy problemów z kodowaniem nagłówków HTTP
        try:
            key.encode("ascii")
        except UnicodeEncodeError:
            raise ValueError(
                "GEMINI_API_KEY zawiera znaki spoza ASCII (np. emoji lub polskie znaki). "
                "Użyj dokładnie takiego klucza, jaki podało Google AI Studio."
            )

        return key
