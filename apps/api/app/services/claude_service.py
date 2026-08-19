import logging

import anthropic

from app.core.config import settings

logger = logging.getLogger(__name__)

LANGUAGE_NAMES = {
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "hi": "Hindi (हिंदी)",
    "mr": "Marathi (मराठी)",
    "bn": "Bengali (বাংলা)",
    "gu": "Gujarati (ગુજરાતી)",
    "en": "English",
}


def _build_user_message(doc_type: str, language: str, form_data: dict) -> str:
    lang_name = LANGUAGE_NAMES.get(language, language)
    lines = "\n".join(f"- {k}: {v}" for k, v in form_data.items())
    return (
        f"Generate a {doc_type} legal document in {lang_name}.\n\n"
        f"Document details:\n{lines}\n\n"
        "Provide only the document text — no explanations or meta-commentary."
    )


async def _try_claude(system_prompt: str, user_message: str) -> str:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    content = message.content[0]
    if content.type != "text":
        raise ValueError("Unexpected response type from Claude API")
    return content.text


async def _try_gemini(system_prompt: str, user_message: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=4096,
        ),
    )
    return response.text


def _is_claude_quota_error(e: anthropic.APIStatusError) -> bool:
    msg = str(e).lower()
    return e.status_code in (402, 529) or "credit balance is too low" in msg


async def generate_legal_document(
    *,
    system_prompt: str,
    doc_type: str,
    language: str,
    form_data: dict,
) -> str:
    user_message = _build_user_message(doc_type, language, form_data)

    # Try Claude first
    if settings.ANTHROPIC_API_KEY:
        try:
            logger.info("Generating with Claude (claude-sonnet-4-6)")
            return await _try_claude(system_prompt, user_message)
        except anthropic.AuthenticationError as e:
            logger.warning("Claude auth failed, falling back to Gemini: %s", e)
        except anthropic.PermissionDeniedError as e:
            logger.warning("Claude permission denied, falling back to Gemini: %s", e)
        except anthropic.APIStatusError as e:
            if _is_claude_quota_error(e):
                logger.warning("Claude quota/credits exhausted, falling back to Gemini: %s", e)
            else:
                raise

    # Fallback to Gemini
    if settings.GEMINI_API_KEY:
        try:
            logger.info("Falling back to Gemini (gemini-2.0-flash)")
            return await _try_gemini(system_prompt, user_message)
        except Exception as e:
            logger.error("Gemini fallback also failed: %s", e)
            raise RuntimeError(f"Both Claude and Gemini failed. Gemini error: {e}") from e

    raise RuntimeError(
        "No LLM available: set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env"
    )
