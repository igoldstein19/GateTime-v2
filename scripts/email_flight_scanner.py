"""
GateTime Flight Email Scanner
Reads Gmail for flight confirmation emails, parses flight details with Claude,
creates a Google Calendar event, and sends an email reminder 5 hours before
departure with GateTime's "Arrive at airport by" breakdown.
"""

import os
import base64
import json
import re
from datetime import datetime, timezone, timedelta
from email import message_from_bytes
from email.mime.text import MIMEText
from typing import Optional
from dotenv import load_dotenv

import anthropic
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# Gmail + Calendar + Send scopes
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.events",
]

TOKEN_FILE = "token.json"
CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")


# ─── Auth ────────────────────────────────────────────────────────────────────

def get_google_credentials() -> Credentials:
    """
    Loads cached OAuth token or runs the browser-based login flow.
    On first run a browser window will open — log in and grant access.
    The token is saved to token.json so you only do this once.
    """
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return creds


# ─── Gmail ───────────────────────────────────────────────────────────────────

def search_flight_emails(gmail_service, max_results: int = 5) -> list:
    """
    Searches Gmail for flight confirmation emails.
    Returns a list of dicts with 'subject', 'from', 'date', and 'body'.
    """
    # Common flight confirmation keywords — adjust as needed
    query = (
        "subject:(flight OR booking OR confirmation OR itinerary OR e-ticket OR reservation) "
        "newer_than:5d"
    )

    result = gmail_service.users().messages().list(
        userId="me", q=query, maxResults=max_results
    ).execute()

    messages = result.get("messages", [])
    if not messages:
        print("No flight emails found.")
        return []

    emails = []
    for msg_ref in messages:
        raw = gmail_service.users().messages().get(
            userId="me", id=msg_ref["id"], format="raw"
        ).execute()

        raw_bytes = base64.urlsafe_b64decode(raw["raw"])
        email_msg = message_from_bytes(raw_bytes)

        plain_body = ""
        html_body = ""
        if email_msg.is_multipart():
            for part in email_msg.walk():
                content_type = part.get_content_type()
                payload = part.get_payload(decode=True)
                if not payload:
                    continue
                decoded = payload.decode("utf-8", errors="ignore")
                if content_type == "text/plain" and not plain_body:
                    plain_body = decoded
                elif content_type == "text/html" and not html_body:
                    html_body = decoded
        else:
            payload = email_msg.get_payload(decode=True)
            if payload:
                plain_body = payload.decode("utf-8", errors="ignore")

        # Prefer HTML stripped of tags — airline emails often have garbled plain text
        if html_body:
            body = re.sub(r"<[^>]+>", " ", html_body)
            body = re.sub(r"[ \t]{2,}", " ", body)
            body = re.sub(r"\n{3,}", "\n\n", body)
        else:
            body = plain_body

        emails.append({
            "subject": email_msg.get("Subject", ""),
            "from": email_msg.get("From", ""),
            "date": email_msg.get("Date", ""),
            "body": body[:8000],  # cap at 8k chars to stay within token budget
        })

    return emails


# ─── Claude parsing ──────────────────────────────────────────────────────────

def parse_flight_details(email: dict) -> Optional[dict]:
    """
    Sends the email content to Claude and asks it to extract structured
    flight information. Returns a dict or None if no flight info found.
    """
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""You are a flight itinerary parser. Extract all flight details from the email below.

Email subject: {email['subject']}
From: {email['from']}
Date received: {email['date']}

Email body:
{email['body']}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{{
  "is_flight_confirmation": true/false,
  "passenger_name": "...",
  "confirmation_code": "...",
  "airline": "...",
  "flights": [
    {{
      "flight_number": "...",
      "origin": "city name and airport code, e.g. Los Angeles (LAX)",
      "destination": "city name and airport code, e.g. New York (JFK)",
      "departure_datetime": "ISO 8601 format WITHOUT timezone suffix, exactly as shown in the email, e.g. 2024-06-15T16:13:00 — do NOT convert to UTC",
      "departure_timezone": "IANA timezone of departure city based on airport code, e.g. America/New_York for BOS",
      "arrival_datetime": "ISO 8601 format WITHOUT timezone suffix, exactly as shown in the email, e.g. 2024-06-15T18:48:00 — do NOT convert to UTC",
      "arrival_timezone": "IANA timezone of arrival city based on airport code, e.g. America/New_York for CHS",
      "duration_minutes": 123
    }}
  ]
}}

If this is not a flight confirmation email, return {{"is_flight_confirmation": false}}.
If a field is unknown, use null."""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[-1].text.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Claude occasionally wraps JSON in markdown — strip it
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())

    if not data.get("is_flight_confirmation"):
        return None

    # Debug — print what Claude extracted so we can verify times
    print("\n  [DEBUG] Claude extracted:")
    for f in data.get("flights", []):
        print(f"    departure_datetime : {f.get('departure_datetime')}")
        print(f"    departure_timezone : {f.get('departure_timezone')}")
        print(f"    arrival_datetime   : {f.get('arrival_datetime')}")
        print(f"    arrival_timezone   : {f.get('arrival_timezone')}")

    return data


# ─── Google Calendar ──────────────────────────────────────────────────────────

def create_calendar_event(calendar_service, flight: dict, trip: dict) -> str:
    """
    Creates a Google Calendar event for a single flight leg.
    Returns the event URL.
    """
    departure = flight["departure_datetime"]
    arrival = flight["arrival_datetime"]
    departure_tz = flight.get("departure_timezone") or "UTC"
    arrival_tz = flight.get("arrival_timezone") or "UTC"

    summary = (
        f"{trip.get('airline', 'Flight')} {flight['flight_number']} — "
        f"{flight['origin']} → {flight['destination']}"
    )

    description_lines = [
        f"Airline: {trip.get('airline', 'N/A')}",
        f"Flight: {flight['flight_number']}",
        f"From: {flight['origin']}",
        f"To: {flight['destination']}",
        f"Confirmation: {trip.get('confirmation_code', 'N/A')}",
        f"Passenger: {trip.get('passenger_name', 'N/A')}",
    ]
    if flight.get("duration_minutes"):
        h, m = divmod(flight["duration_minutes"], 60)
        description_lines.append(f"Duration: {h}h {m}m")

    event = {
        "summary": summary,
        "description": "\n".join(description_lines),
        "start": {"dateTime": departure, "timeZone": departure_tz},
        "end": {"dateTime": arrival, "timeZone": arrival_tz},
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 24 * 60},  # 1 day before
                {"method": "popup", "minutes": 180},       # 3 hours before
            ],
        },
    }

    created = calendar_service.events().insert(calendarId="primary", body=event).execute()
    return created.get("htmlLink", "")


# ─── GateTime Airport Arrival Calculator ─────────────────────────────────────

# Seed estimates: terminal -> time_bucket -> {check_in, security}
SEED_ESTIMATES = {
    "A": {"early_morning": (8, 8), "morning": (15, 20), "midday": (10, 12), "afternoon": (15, 18), "evening": (12, 15)},
    "B": {"early_morning": (10, 10), "morning": (18, 25), "midday": (12, 15), "afternoon": (18, 22), "evening": (14, 18)},
    "C": {"early_morning": (8, 10), "morning": (15, 22), "midday": (10, 14), "afternoon": (15, 20), "evening": (12, 16)},
    "E": {"early_morning": (12, 12), "morning": (20, 25), "midday": (15, 15), "afternoon": (22, 25), "evening": (18, 20)},
}

WALK_TIMES = {"A": 6, "B": 6, "C": 5, "E": 6}  # avg walk minutes per terminal

# Airline -> terminal mapping for BOS
AIRLINE_TERMINAL = {
    "delta": "A",
    "american": "B", "american airlines": "B",
    "united": "B", "united airlines": "B",
    "jetblue": "C",
    "southwest": "B", "southwest airlines": "B",
    "spirit": "B", "spirit airlines": "B",
    "frontier": "B", "frontier airlines": "B",
    "air canada": "B",
    "cape air": "C",
    "british airways": "E",
    "emirates": "E",
    "aer lingus": "E",
    "tap air portugal": "E", "tap portugal": "E",
    "iberia": "E",
    "latam": "E", "latam airlines": "E",
    "lufthansa": "E",
    "turkish airlines": "E", "turkish": "E",
    "copa airlines": "E", "copa": "E",
}

INTERNATIONAL_TERMINALS = {"E"}


def get_time_bucket(hour: int) -> str:
    if 4 <= hour < 7: return "early_morning"
    if 7 <= hour < 10: return "morning"
    if 10 <= hour < 14: return "midday"
    if 14 <= hour < 17: return "afternoon"
    return "evening"


def calculate_arrive_by(departure_dt: datetime, airline: str) -> dict:
    """Calculate when to arrive at the airport, working backward from flight time."""
    # Resolve terminal
    airline_lower = airline.lower().strip()
    terminal = None
    for key, term in AIRLINE_TERMINAL.items():
        if key in airline_lower or airline_lower in key:
            terminal = term
            break
    if not terminal:
        terminal = "B"  # default fallback

    is_international = terminal in INTERNATIONAL_TERMINALS
    boarding_buffer = 45 if is_international else 30
    walk_time = WALK_TIMES.get(terminal, 6)

    # Work backward to estimate arrival time bucket
    estimated_arrival_hour = (departure_dt - timedelta(minutes=boarding_buffer + walk_time + 20)).hour
    time_bucket = get_time_bucket(estimated_arrival_hour)

    check_in, security = SEED_ESTIMATES.get(terminal, SEED_ESTIMATES["B"]).get(time_bucket, (15, 20))

    total_buffer = boarding_buffer + walk_time + security + check_in
    arrive_by = departure_dt - timedelta(minutes=total_buffer)

    return {
        "arrive_by": arrive_by,
        "terminal": terminal,
        "is_international": is_international,
        "boarding_buffer": boarding_buffer,
        "walk_time": walk_time,
        "security": security,
        "check_in": check_in,
        "total_buffer": total_buffer,
    }


# ─── Email Reminder ──────────────────────────────────────────────────────────

def send_reminder_email(gmail_service, to_email: str, flight: dict, trip: dict, calc: dict):
    """Send an HTML email reminder with GateTime's arrive-by breakdown."""
    dep_dt = datetime.fromisoformat(flight["departure_datetime"])
    arrive_by = calc["arrive_by"]

    subject = f"GateTime Reminder: Arrive at BOS by {arrive_by.strftime('%I:%M %p')} for {flight['flight_number']}"

    html = f"""<html><body style="font-family: 'Inter', Arial, sans-serif; background: #F5F6F8; padding: 20px;">
<div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">

  <!-- Header -->
  <div style="background: #0A0F1E; padding: 32px 28px; text-align: center;">
    <div style="color: #C5A255; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px;">GateTime Reminder</div>
    <div style="color: white; font-size: 14px; opacity: 0.6; margin-bottom: 16px;">Boston Logan International (BOS)</div>
    <div style="color: #34D399; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">ARRIVE AT AIRPORT BY</div>
    <div style="color: white; font-size: 48px; font-weight: 700; font-family: 'Poppins', Arial, sans-serif; line-height: 1.1;">{arrive_by.strftime('%I:%M %p')}</div>
    <div style="color: rgba(255,255,255,0.5); font-size: 13px; margin-top: 8px;">Terminal {calc['terminal']} &middot; {trip.get('airline', 'Airline')}</div>
  </div>

  <!-- Flight info -->
  <div style="padding: 24px 28px; border-bottom: 1px solid #F0F0F0;">
    <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Flight</div>
    <div style="font-size: 18px; font-weight: 700; color: #1A1A2E; margin-bottom: 4px;">{flight['flight_number']}: {flight['origin']} &rarr; {flight['destination']}</div>
    <div style="font-size: 14px; color: #6B7280;">Departs {dep_dt.strftime('%B %d, %Y')} at {dep_dt.strftime('%I:%M %p')}</div>
    <div style="font-size: 13px; color: #6B7280; margin-top: 2px;">Confirmation: <strong>{trip.get('confirmation_code', 'N/A')}</strong></div>
  </div>

  <!-- Timeline breakdown -->
  <div style="padding: 24px 28px;">
    <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">Your Timeline</div>

    <!-- Arrive at airport -->
    <div style="display: flex; align-items: flex-start; margin-bottom: 0;">
      <div style="width: 24px; display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
        <div style="width: 14px; height: 14px; border-radius: 50%; background: #34D399; border: 3px solid #D1FAE5;"></div>
        <div style="width: 1px; height: 28px; background: #E5E7EB;"></div>
      </div>
      <div style="margin-left: 12px; padding-bottom: 12px;">
        <div style="font-size: 15px; font-weight: 700; color: #1A1A2E;">{arrive_by.strftime('%I:%M %p')} - Arrive at airport</div>
        <div style="font-size: 12px; color: #6B7280;">Terminal {calc['terminal']} entrance</div>
      </div>
    </div>

    <!-- Check-in -->
    <div style="display: flex; align-items: flex-start; margin-bottom: 0;">
      <div style="width: 24px; display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #3B82F6; margin-top: 2px;"></div>
        <div style="width: 1px; height: 28px; background: #E5E7EB;"></div>
      </div>
      <div style="margin-left: 12px; padding-bottom: 12px;">
        <div style="font-size: 14px; color: #1A1A2E;"><strong>{calc['check_in']} min</strong> - Check-in</div>
      </div>
    </div>

    <!-- Security -->
    <div style="display: flex; align-items: flex-start; margin-bottom: 0;">
      <div style="width: 24px; display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #F59E0B; margin-top: 2px;"></div>
        <div style="width: 1px; height: 28px; background: #E5E7EB;"></div>
      </div>
      <div style="margin-left: 12px; padding-bottom: 12px;">
        <div style="font-size: 14px; color: #1A1A2E;"><strong>{calc['security']} min</strong> - Security</div>
      </div>
    </div>

    <!-- Walk to gate -->
    <div style="display: flex; align-items: flex-start; margin-bottom: 0;">
      <div style="width: 24px; display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #6B7280; margin-top: 2px;"></div>
        <div style="width: 1px; height: 28px; background: #E5E7EB;"></div>
      </div>
      <div style="margin-left: 12px; padding-bottom: 12px;">
        <div style="font-size: 14px; color: #1A1A2E;"><strong>{calc['walk_time']} min</strong> - Walk to gate</div>
      </div>
    </div>

    <!-- Boarding -->
    <div style="display: flex; align-items: flex-start; margin-bottom: 0;">
      <div style="width: 24px; display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #34D399; margin-top: 2px;"></div>
        <div style="width: 1px; height: 28px; background: #E5E7EB;"></div>
      </div>
      <div style="margin-left: 12px; padding-bottom: 12px;">
        <div style="font-size: 14px; color: #1A1A2E;"><strong>{calc['boarding_buffer']} min</strong> - Boarding {'(international)' if calc['is_international'] else ''}</div>
      </div>
    </div>

    <!-- Departure -->
    <div style="display: flex; align-items: flex-start;">
      <div style="width: 24px; display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
        <div style="width: 14px; height: 14px; border-radius: 50%; background: #0A0F1E; border: 3px solid #D1D5DB;"></div>
      </div>
      <div style="margin-left: 12px;">
        <div style="font-size: 15px; font-weight: 700; color: #1A1A2E;">{dep_dt.strftime('%I:%M %p')} - Flight departs</div>
        <div style="font-size: 12px; color: #6B7280;">{flight['flight_number']} to {flight['destination']}</div>
      </div>
    </div>
  </div>

  <!-- Footer note -->
  <div style="padding: 16px 28px; background: #F9FAFB; border-top: 1px solid #F0F0F0; text-align: center;">
    <div style="font-size: 11px; color: #9CA3AF;">Allow extra 10 min if driving/parking &middot; Estimates based on GateTime data</div>
    <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">Visit <a href="https://gatetime-v2.vercel.app" style="color: #34D399; text-decoration: none;">GateTime</a> for live wait times</div>
  </div>

</div>
</body></html>"""

    message = MIMEText(html, "html")
    message["to"] = to_email
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    gmail_service.users().messages().send(
        userId="me", body={"raw": raw}
    ).execute()

    print(f"     Email reminder sent to {to_email}")


def schedule_reminder(gmail_service, to_email: str, flight: dict, trip: dict, calc: dict):
    """Send reminder immediately (for now). In production, schedule 5h before departure."""
    dep_dt = datetime.fromisoformat(flight["departure_datetime"])
    arrive_by = calc["arrive_by"]

    print(f"     Arrive at airport by: {arrive_by.strftime('%I:%M %p')}")
    print(f"     Breakdown: check-in {calc['check_in']}m + security {calc['security']}m + walk {calc['walk_time']}m + boarding {calc['boarding_buffer']}m = {calc['total_buffer']}m before flight")

    send_reminder_email(gmail_service, to_email, flight, trip, calc)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("Authenticating with Google...")
    creds = get_google_credentials()
    gmail = build("gmail", "v1", credentials=creds)
    calendar = build("calendar", "v3", credentials=creds)

    print("Searching for flight confirmation emails...")
    emails = search_flight_emails(gmail, max_results=10)

    if not emails:
        print("Done - no flight emails found.")
        return

    print(f"Found {len(emails)} candidate email(s). Parsing with Claude...")

    # Get user's email for reminders
    profile = gmail.users().getProfile(userId="me").execute()
    user_email = profile["emailAddress"]
    print(f"Signed in as: {user_email}")

    created_count = 0
    for email in emails:
        print(f"\n  Checking: {email['subject'][:70]}")
        trip = parse_flight_details(email)

        if not trip:
            print("  -> Not a flight confirmation, skipping.")
            continue

        print(f"  -> Flight found! {trip.get('airline')} | {trip.get('confirmation_code')}")

        for flight in trip.get("flights", []):
            print(f"     {flight['flight_number']}: {flight['origin']} -> {flight['destination']}")
            url = create_calendar_event(calendar, flight, trip)
            print(f"     Calendar event created: {url}")

            # Calculate GateTime arrive-by and send email reminder
            dep_dt = datetime.fromisoformat(flight["departure_datetime"])
            calc = calculate_arrive_by(dep_dt, trip.get("airline", ""))
            schedule_reminder(gmail, user_email, flight, trip, calc)

            created_count += 1

    print(f"\nDone. Created {created_count} calendar event(s) with email reminders.")


if __name__ == "__main__":
    main()
