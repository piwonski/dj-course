from pydantic import BaseModel, Field, validator
from typing import Literal


class OpenAIConfig(BaseModel):
    """
    Konfiguracja klienta OpenAI.
    Waliduje podstawowe zmienne środowiskowe wymagane do poprawnego działania.
    """

    engine: Literal["OPEN_AI"] = Field(default="OPEN_AI")
    model_name: str = Field(..., description="Nazwa modelu OpenAI (np. gpt-4o-mini)")
    openai_api_key: str = Field(..., min_length=1, description="Klucz API OpenAI")

    @validator("openai_api_key")
    def validate_api_key(cls, v: str) -> str:
        """
        Podstawowa walidacja klucza OpenAI:
        - niepusty
        - bez białych znaków
        - tylko ASCII (bez emoji/polskich znaków – nagłówki HTTP)
        """
        if not v or v.strip() == "":
            raise ValueError("OPENAI_API_KEY nie jest ustawiony w zmiennych środowiskowych lub jest pusty")

        key = v.strip()

        # Klucz nie może zawierać spacji / nowych linii itp.
        if any(ch.isspace() for ch in key):
            raise ValueError("OPENAI_API_KEY nie może zawierać spacji ani znaków nowej linii")

        # Zapobiega problemom z kodowaniem nagłówków HTTP
        try:
            key.encode("ascii")
        except UnicodeEncodeError:
            raise ValueError(
                "OPENAI_API_KEY zawiera znaki spoza ASCII (np. emoji lub polskie znaki). "
                "Użyj dokładnie takiego klucza, jaki podało OpenAI."
            )

        return key


