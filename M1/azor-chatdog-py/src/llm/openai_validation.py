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
        Upewnia się, że klucz API nie jest pusty ani nie zawiera tylko białych znaków.
        """
        if not v or v.strip() == "":
            raise ValueError("OPENAI_API_KEY nie może być pusty")
        return v.strip()


