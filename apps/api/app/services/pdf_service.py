import io

TAMIL_FONT_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap');

body {
    font-family: 'Noto Sans Tamil', sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1a1a1a;
    margin: 40px;
}

h1, h2, h3 {
    font-weight: 700;
    margin-bottom: 12px;
}

p {
    margin-bottom: 10px;
    text-align: justify;
}

.document-header {
    text-align: center;
    border-bottom: 2px solid #333;
    padding-bottom: 16px;
    margin-bottom: 24px;
}

.signature-block {
    margin-top: 48px;
    display: flex;
    justify-content: space-between;
}
"""

LANGUAGE_CSS_MAP: dict[str, str] = {
    "ta": TAMIL_FONT_CSS,
    "en": "body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; margin: 40px; }",
}


def generate_pdf(document_text: str, language: str = "ta") -> bytes:
    css = LANGUAGE_CSS_MAP.get(language, TAMIL_FONT_CSS)
    newline = "\n"
    paragraphs = "".join(
        f"<p>{line}</p>" for line in document_text.split(newline) if line.strip()
    )
    html_content = f"""
    <!DOCTYPE html>
    <html lang="{language}">
    <head>
        <meta charset="UTF-8">
        <style>{css}</style>
    </head>
    <body>
        {paragraphs}
    </body>
    </html>
    """

    buffer = io.BytesIO()
    try:
        from weasyprint import HTML  # system deps required; available in Docker
        HTML(string=html_content).write_pdf(buffer)
    except ImportError:
        # Fallback for local dev without WeasyPrint system deps
        buffer.write(html_content.encode("utf-8"))
    return buffer.getvalue()
