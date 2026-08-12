import asyncio
import resend

from app.core.config import settings


async def _send(payload: dict):
    if not settings.resend_api_key:
        return None
    resend.api_key = settings.resend_api_key
    return await asyncio.to_thread(resend.Emails.send, payload)


async def send_lead_notifications(reference_no: str, first_name: str, email: str, message: str):
    tasks = []
    if settings.contact_notification_email:
        tasks.append(_send({
            'from': settings.email_from,
            'to': [settings.contact_notification_email],
            'subject': f'New ONIRIA enquiry {reference_no}',
            'html': f'<p>New enquiry <strong>{reference_no}</strong> from {first_name} ({email}).</p><p>{message}</p>',
        }))
    tasks.append(_send({
        'from': settings.email_from,
        'to': [email],
        'subject': f'We received your ONIRIA enquiry — {reference_no}',
        'html': f'<p>Dear {first_name},</p><p>Thank you for contacting ONIRIA Investments. Your reference is <strong>{reference_no}</strong>.</p>',
    }))
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
