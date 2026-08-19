import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_otp_sms(phone: str, otp: str) -> None:
    """Send OTP via Twilio WhatsApp or SMS. Falls back to log in dev mode."""
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN):
        logger.warning("⚠️  Twilio not configured — SMS OTP for %s: %s", phone, otp)
        print(f"\n{'='*50}\n  DEV SMS OTP for {phone}: {otp}\n{'='*50}\n", flush=True)
        return

    from twilio.rest import Client as TwilioClient  # type: ignore[import-untyped]
    client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    message_body = f"VaakiL AI OTP: {otp}\n\nஒரு முறை கடவுச்சொல். 10 நிமிடங்களுக்கு செல்லுபடியாகும்.\nDo not share this with anyone."

    # Try SMS first; WhatsApp as fallback
    try:
        client.messages.create(
            body=message_body,
            from_=settings.TWILIO_SMS_FROM if hasattr(settings, "TWILIO_SMS_FROM") and settings.TWILIO_SMS_FROM else settings.TWILIO_WHATSAPP_FROM.replace("whatsapp:", ""),  # type: ignore[union-attr]
            to=phone,
        )
        logger.info("SMS OTP sent to %s", phone)
    except Exception as e:
        logger.error("Twilio SMS failed for %s: %s", phone, e)
        raise


async def send_otp_email(email: str, otp: str) -> None:
    # Always log OTP to file in dev so automated tests can retrieve it
    try:
        with open("/tmp/vakkil_otp.log", "a") as _f:
            _f.write(f"OTP for {email}: {otp}\n")
    except Exception:
        pass

    def _dev_fallback(reason: str) -> None:
        logger.warning("⚠️  %s — OTP for %s: %s", reason, email, otp)
        print(f"\n{'='*60}\n  OTP for {email}: {otp}\n  (check terminal — email delivery fallback)\n{'='*60}\n", flush=True)

    if not settings.RESEND_API_KEY:
        _dev_fallback("RESEND_API_KEY not set")
        return

    resend.api_key = settings.RESEND_API_KEY

    try:
        resend.Emails.send({
            "from": "VaakiL AI <onboarding@resend.dev>",
            "to": [email],
            "subject": f"VaakiL AI — உங்கள் OTP: {otp}",
            "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #1e40af; margin-bottom: 4px;">VaakiL AI</h2>
                <p style="color: #64748b; margin-top: 0; font-size: 13px;">வாக்கீல் AI — Advocate's Daily OS</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="color: #334155;">உங்கள் One-Time Password:</p>
                <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #1e40af;">{otp}</span>
                </div>
                <p style="color: #64748b; font-size: 13px;">இது <strong>10 நிமிடங்களுக்கு</strong> மட்டுமே செல்லுபடியாகும்.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="color: #94a3b8; font-size: 11px;">நீங்கள் இதை request பண்ணவில்லை என்றால் இந்த email-ஐ ignore பண்ணுங்கள்.</p>
            </div>
            """,
        })
        logger.info("OTP email sent to %s via Resend", email)
    except Exception as e:
        # Resend sandbox only allows sending to the registered address.
        # Fall back to terminal print so dev login still works.
        _dev_fallback(f"Resend delivery failed ({e})")
