"""
Run after model changes to apply new columns to existing tables.
Usage: .venv/bin/python migrate.py
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine


MIGRATIONS = [
    # 2026-06-06: added is_admin to users, cnr_number to cases
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE cases ADD COLUMN IF NOT EXISTS cnr_number VARCHAR(30) UNIQUE",
    # 2026-06-06: client portal fields
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_otp_hash TEXT",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_otp_expires TIMESTAMPTZ",
    # 2026-06-06: document sharing with client portal
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_with_client BOOLEAN NOT NULL DEFAULT false",
    # 2026-06-06: optional password for advocates (OTP remains primary)
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT",
]


async def run() -> None:
    async with engine.begin() as conn:
        for sql in MIGRATIONS:
            try:
                await conn.execute(text(sql))
                print(f"  OK  {sql[:70]}")
            except Exception as e:
                print(f"  ERR {sql[:70]}\n       {e}")
    print("\nDone.")


asyncio.run(run())
