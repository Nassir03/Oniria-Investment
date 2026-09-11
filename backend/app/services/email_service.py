import asyncio
from html import escape

import resend

from app.core.config import settings


async def _send(payload: dict):
    if not settings.resend_api_key:
        return None
    resend.api_key = settings.resend_api_key
    return await asyncio.to_thread(resend.Emails.send, payload)


async def send_lead_notifications(reference_no: str, first_name: str, email: str, message: str):
    safe_reference = escape(reference_no)
    safe_first_name = escape(first_name)
    safe_email = escape(email)
    safe_message = escape(message).replace('\n', '<br>')

    tasks = []
    if settings.contact_notification_email:
        tasks.append(_send({
            'from': settings.email_from,
            'to': [settings.contact_notification_email],
            'subject': f'New ONIRIA enquiry {reference_no}',
            'html': (
                f'<p>New enquiry <strong>{safe_reference}</strong> '
                f'from {safe_first_name} ({safe_email}).</p><p>{safe_message}</p>'
            ),
        }))
    tasks.append(_send({
        'from': settings.email_from,
        'to': [email],
        'subject': f'We received your ONIRIA enquiry — {reference_no}',
        'html': (
            f'<p>Dear {safe_first_name},</p>'
            f'<p>Thank you for contacting ONIRIA Investments. '
            f'Your reference is <strong>{safe_reference}</strong>.</p>'
        ),
    }))
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
