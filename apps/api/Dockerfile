FROM python:3.11-slim

WORKDIR /app

# System deps for WeasyPrint (PDF generation) + Tamil font support
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    fonts-noto-core \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Download Noto Sans Tamil font
RUN mkdir -p /usr/share/fonts/truetype/noto && \
    wget -q "https://github.com/googlefonts/noto-fonts/raw/main/phaseIII_only/unhinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf" \
    -O /usr/share/fonts/truetype/noto/NotoSansTamil-Regular.ttf && \
    fc-cache -fv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
