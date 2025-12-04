"""
OpenAI LLM Client Implementation
Encapsulates all OpenAI interactions in a unified interface compatible with GeminiLLMClient and LlamaClient.
"""

import os
from typing import Optional, List, Any, Dict

from dotenv import load_dotenv
from openai import OpenAI
import tiktoken

from cli import console
from .openai_validation import OpenAIConfig


class OpenAIChatSessionWrapper:
    """
    Wrapper for OpenAI chat session that provides universal dictionary-based history format.
    This mirrors the behaviour of GeminiChatSessionWrapper.
    """

    def __init__(
        self,
        client: OpenAI,
        model_name: str,
        system_instruction: str,
        history: Optional[List[Dict]] = None,
        top_p: Optional[float] = None,
        temperature: Optional[float] = None,
    ):
        """
        Initialize wrapper with OpenAI client and configuration.

        Args:
            client: The OpenAI client instance
            model_name: Model name to use for chat completions
            system_instruction: System prompt / instruction for the assistant
            history: Previous conversation history in universal dict format
            top_p: Nucleus sampling parameter (0-1). Controls diversity via nucleus sampling.
            temperature: Sampling temperature (0-2). Higher values make output more random.
        
        Note:
            OpenAI API does not support top_k parameter (unlike Gemini or LLaMA).
        """
        self._client = client
        self._model_name = model_name
        self._system_instruction = system_instruction
        self._history: List[Dict] = history or []
        self._top_p = top_p
        self._temperature = temperature

    def send_message(self, text: str) -> Any:
        """
        Sends a message to the OpenAI model and returns a response-like object with .text.

        Args:
            text: User's message

        Returns:
            Response object with .text attribute containing the response
        """
        # Add user message to history
        user_message = {"role": "user", "parts": [{"text": text}]}
        self._history.append(user_message)

        # Build messages for OpenAI API: system + conversation history
        messages = []
        if self._system_instruction:
            messages.append({"role": "system", "content": self._system_instruction})

        for message in self._history:
            role = message.get("role", "user")
            text_part = ""
            if "parts" in message and message["parts"]:
                text_part = message["parts"][0].get("text", "")
            if not text_part:
                continue

            if role == "user":
                messages.append({"role": "user", "content": text_part})
            elif role == "model":
                messages.append({"role": "assistant", "content": text_part})

        try:
            # Prepare API call arguments
            call_kwargs = {
                "model": self._model_name,
                "messages": messages,
            }
            
            # Add optional sampling parameters if provided
            if self._temperature is not None:
                call_kwargs["temperature"] = self._temperature
            if self._top_p is not None:
                call_kwargs["top_p"] = self._top_p
            
            completion = self._client.chat.completions.create(**call_kwargs)

            response_text = completion.choices[0].message.content.strip()

            # Add assistant response to history
            assistant_message = {"role": "model", "parts": [{"text": response_text}]}
            self._history.append(assistant_message)

            return OpenAIResponse(response_text)
        except Exception as e:
            console.print_error(f"Błąd podczas generowania odpowiedzi OpenAI: {e}")
            error_text = "Przepraszam, wystąpił błąd podczas generowania odpowiedzi."
            assistant_message = {"role": "model", "parts": [{"text": error_text}]}
            self._history.append(assistant_message)
            return OpenAIResponse(error_text)

    def get_history(self) -> List[Dict]:
        """
        Returns conversation history in universal dictionary format.
        """
        return self._history


class OpenAIResponse:
    """
    Simple response object that mimics the Gemini / LLaMA response interface.
    Provides a .text attribute containing the response text.
    """

    def __init__(self, text: str):
        self.text = text


class OpenAILLMClient:
    """
    Encapsulates all OpenAI model interactions.
    Provides a clean interface for chat sessions, token counting, and configuration.
    """

    def __init__(self, model_name: str, api_key: str):
        """
        Initialize the OpenAI LLM client with explicit parameters.

        Args:
            model_name: Model to use (e.g., 'gpt-4o-mini')
            api_key: OpenAI API key

        Raises:
            ValueError: If api_key is empty or None
        """
        if not api_key:
            raise ValueError("API key cannot be empty or None")

        self.model_name = model_name
        self.api_key = api_key

        self._client = self._initialize_client()

    @staticmethod
    def preparing_for_use_message() -> str:
        """
        Returns a message indicating that OpenAI client is being prepared.
        """
        return "🧠 Przygotowywanie klienta OpenAI..."

    @classmethod
    def from_environment(cls) -> "OpenAILLMClient":
        """
        Factory method that creates an OpenAILLMClient instance from environment variables.

        Expected environment variables:
            OPENAI_MODEL_NAME: Name of the OpenAI model to use
            OPENAI_API_KEY: OpenAI API key
        """
        load_dotenv()

        # Walidacja z Pydantic
        # Jeśli zmienna środowiskowa OPENAI_API_KEY nie jest ustawiona,
        # wstrzykujemy jedną spację. Przejdzie ona `min_length=1`,
        # ale zostanie odrzucona przez walidator `.strip()`.
        config = OpenAIConfig(
            model_name=os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini"),
            openai_api_key=os.getenv("OPENAI_API_KEY", " "),
        )

        return cls(model_name=config.model_name, api_key=config.openai_api_key)

    def _initialize_client(self) -> OpenAI:
        """
        Initializes the OpenAI client using the stored API key.
        """
        try:
            return OpenAI(api_key=self.api_key)
        except Exception as e:
            console.print_error(f"Błąd inicjalizacji klienta OpenAI: {e}")
            raise

    def create_chat_session(
        self,
        system_instruction: str,
        history: Optional[List[Dict]] = None,
        thinking_budget: int = 0,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> OpenAIChatSessionWrapper:
        """
        Creates a new chat session with the specified configuration.

        Args:
            system_instruction: System role/prompt for the assistant
            history: Previous conversation history (optional, in universal dict format)
            thinking_budget: Unused (for interface compatibility)
            top_p: Nucleus sampling parameter (0-1). Controls diversity via nucleus sampling.
            top_k: NOT SUPPORTED by OpenAI API (kept for interface compatibility only)
            temperature: Sampling temperature (0-2). Higher values make output more random.

        Returns:
            OpenAIChatSessionWrapper with universal dictionary-based interface
        
        Note:
            OpenAI API does not support top_k parameter. Only temperature and top_p are used.
        """
        # Unused parameters (for interface compatibility)
        _ = thinking_budget
        _ = top_k  # OpenAI API doesn't support top_k
        
        return OpenAIChatSessionWrapper(
            client=self._client,
            model_name=self.model_name,
            system_instruction=system_instruction,
            history=history or [],
            top_p=top_p,
            temperature=temperature,
        )

    def count_history_tokens(self, history: List[Dict]) -> int:
        """
        Counts tokens for the given conversation history using tiktoken.
        """
        if not history:
            return 0

        try:
            # Build full text from history
            text_parts: List[str] = []
            for message in history:
                if "parts" in message and message["parts"]:
                    text_parts.append(message["parts"][0].get("text", ""))

            full_text = " ".join(text_parts)

            if not full_text:
                return 0

            # Try to get encoding for the configured model; fallback to a generic encoding
            try:
                encoder = tiktoken.encoding_for_model(self.model_name)
            except Exception:
                encoder = tiktoken.get_encoding("cl100k_base")

            tokens = encoder.encode(full_text)
            return len(tokens)
        except Exception as e:
            console.print_error(f"Błąd podczas liczenia tokenów OpenAI: {e}")
            # Fallback: rough estimation (4 chars per token)
            total_chars = sum(
                len(msg["parts"][0].get("text", ""))
                for msg in history
                if "parts" in msg and msg["parts"]
            )
            return total_chars // 4

    def get_model_name(self) -> str:
        """Returns the currently configured model name."""
        return self.model_name

    def is_available(self) -> bool:
        """
        Checks if the LLM service is available and properly configured.
        """
        return self._client is not None and bool(self.api_key)

    def ready_for_use_message(self) -> str:
        """
        Returns a ready-to-use message with model info and masked API key.
        """
        if len(self.api_key) <= 8:
            masked_key = "****"
        else:
            masked_key = f"{self.api_key[:4]}...{self.api_key[-4:]}"

        return f"✅ Klient OpenAI gotowy do użycia (Model: {self.model_name}, Key: {masked_key})"

    @property
    def client(self):
        """
        Provides access to the underlying OpenAI client (for backwards compatibility).
        """
        return self._client


