"""Run from apps/api/: .venv/bin/python seed_templates.py"""
import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.document import Template

TEMPLATES = [
    {
        "name": "Legal Notice",
        "slug": "legal-notice",
        "description": "Formal legal notice to an individual or organisation for recovery of money, property, or legal compliance.",
        "doc_type": "legal_notice",
        "supported_languages": ["ta", "en", "te", "hi"],
        "is_premium": False,
        "form_schema": {
            "type": "object",
            "required": ["sender_name", "sender_address", "recipient_name", "recipient_address", "subject", "details", "demand", "notice_period_days"],
            "properties": {
                "sender_name":           {"type": "string", "title": "Sender Full Name"},
                "sender_address":        {"type": "string", "title": "Sender Address"},
                "recipient_name":        {"type": "string", "title": "Recipient Full Name / Company"},
                "recipient_address":     {"type": "string", "title": "Recipient Address"},
                "subject":               {"type": "string", "title": "Subject of Notice"},
                "details":               {"type": "string", "title": "Full Details / Grievance"},
                "demand":                {"type": "string", "title": "What You Are Demanding"},
                "notice_period_days":    {"type": "number", "title": "Days to Comply (e.g. 15, 30)"},
                "amount_if_any":         {"type": "string", "title": "Amount Claimed (₹) — if applicable"},
            },
        },
        "system_prompt": (
            "You are an expert Indian legal document drafter with 20+ years of experience in High Courts. "
            "Draft a formal legal notice strictly following Indian legal conventions. "
            "The notice must be professional, clear, and legally sound. "
            "Include proper salutation, facts, legal basis, demand, and consequences of non-compliance. "
            "Do NOT include any explanation or commentary — output only the notice document text. "
            "Use the exact language requested (Tamil/English/Telugu/Hindi)."
        ),
    },
    {
        "name": "Rent Agreement",
        "slug": "rent-agreement",
        "description": "Residential or commercial rental agreement between landlord and tenant.",
        "doc_type": "rent_agreement",
        "supported_languages": ["ta", "en", "hi"],
        "is_premium": False,
        "form_schema": {
            "type": "object",
            "required": ["landlord_name", "landlord_address", "tenant_name", "tenant_address", "property_address", "rent_amount", "security_deposit", "duration_months", "start_date"],
            "properties": {
                "landlord_name":       {"type": "string", "title": "Landlord Full Name"},
                "landlord_address":    {"type": "string", "title": "Landlord Permanent Address"},
                "tenant_name":         {"type": "string", "title": "Tenant Full Name"},
                "tenant_address":      {"type": "string", "title": "Tenant Permanent Address"},
                "property_address":    {"type": "string", "title": "Rental Property Address"},
                "rent_amount":         {"type": "number", "title": "Monthly Rent (₹)"},
                "security_deposit":    {"type": "number", "title": "Security Deposit (₹)"},
                "duration_months":     {"type": "number", "title": "Agreement Duration (months)"},
                "start_date":          {"type": "string", "title": "Start Date (DD/MM/YYYY)"},
                "maintenance_charges": {"type": "string", "title": "Maintenance Charges (if any)"},
            },
        },
        "system_prompt": (
            "You are an expert Indian property lawyer. "
            "Draft a complete, legally binding rental/lease agreement following Indian laws (Transfer of Property Act, 1882; Registration Act, 1908). "
            "Include all standard clauses: parties, property description, rent, deposit, duration, maintenance, termination, dispute resolution. "
            "Output only the agreement document — no commentary. "
            "Use the language requested."
        ),
    },
    {
        "name": "Consumer Complaint",
        "slug": "consumer-complaint",
        "description": "Complaint petition to Consumer Forum / NCDRC for defective goods or deficient services.",
        "doc_type": "consumer_complaint",
        "supported_languages": ["ta", "en", "hi"],
        "is_premium": False,
        "form_schema": {
            "type": "object",
            "required": ["complainant_name", "complainant_address", "opposite_party_name", "opposite_party_address", "product_or_service", "purchase_date", "amount_paid", "grievance", "relief_sought"],
            "properties": {
                "complainant_name":        {"type": "string", "title": "Complainant Full Name"},
                "complainant_address":     {"type": "string", "title": "Complainant Address"},
                "opposite_party_name":     {"type": "string", "title": "Opposite Party (Company/Shop Name)"},
                "opposite_party_address":  {"type": "string", "title": "Opposite Party Address"},
                "product_or_service":      {"type": "string", "title": "Product or Service Name"},
                "purchase_date":           {"type": "string", "title": "Purchase Date"},
                "amount_paid":             {"type": "number", "title": "Amount Paid (₹)"},
                "grievance":               {"type": "string", "title": "Detailed Grievance"},
                "relief_sought":           {"type": "string", "title": "Relief / Compensation Sought"},
                "evidence":                {"type": "string", "title": "Evidence Available (bills, receipts, emails)"},
            },
        },
        "system_prompt": (
            "You are an expert in Indian consumer law (Consumer Protection Act, 2019). "
            "Draft a formal complaint petition for the District Consumer Disputes Redressal Commission. "
            "Follow the proper petition format: title, parties, facts, cause of action, reliefs, prayer clause. "
            "Output only the petition document — no explanation. "
            "Use the language requested."
        ),
    },
    {
        "name": "Bail Application",
        "slug": "bail-application",
        "description": "Regular bail application under Section 483 BNSS (formerly S.439 CrPC) for Sessions Court.",
        "doc_type": "bail_application",
        "supported_languages": ["ta", "en"],
        "is_premium": True,
        "form_schema": {
            "type": "object",
            "required": ["applicant_name", "applicant_age", "fir_number", "police_station", "offence_sections", "court_name", "brief_facts", "grounds_for_bail"],
            "properties": {
                "applicant_name":      {"type": "string", "title": "Applicant (Accused) Full Name"},
                "applicant_age":       {"type": "number", "title": "Age"},
                "fir_number":          {"type": "string", "title": "FIR / Case Number"},
                "police_station":      {"type": "string", "title": "Police Station"},
                "offence_sections":    {"type": "string", "title": "Sections of Offence (e.g. 420 IPC, 138 NI Act)"},
                "court_name":          {"type": "string", "title": "Court Name"},
                "brief_facts":         {"type": "string", "title": "Brief Facts of the Case"},
                "grounds_for_bail":    {"type": "string", "title": "Grounds for Granting Bail"},
                "sureties":            {"type": "string", "title": "Surety Details (if ready)"},
            },
        },
        "system_prompt": (
            "You are a seasoned criminal lawyer practising in Indian Sessions Courts. "
            "Draft a formal bail application under Section 483 BNSS (formerly S.439 CrPC). "
            "Follow the proper format: court heading, applicant details, case details, grounds, prayer. "
            "Arguments must be persuasive and cite relevant Supreme Court/High Court precedents where appropriate. "
            "Output only the application — no commentary. Use the language requested."
        ),
    },
    {
        "name": "Vakalatnama",
        "slug": "vakalatnama",
        "description": "Formal authorization document from client to advocate to appear and plead in court.",
        "doc_type": "vakalatnama",
        "supported_languages": ["ta", "en", "hi", "te"],
        "is_premium": False,
        "form_schema": {
            "type": "object",
            "required": ["client_name", "client_address", "advocate_name", "advocate_enrollment", "court_name", "case_number", "case_year", "opposing_party"],
            "properties": {
                "client_name":           {"type": "string", "title": "Client Full Name"},
                "client_address":        {"type": "string", "title": "Client Address"},
                "advocate_name":         {"type": "string", "title": "Advocate Full Name"},
                "advocate_enrollment":   {"type": "string", "title": "Bar Council Enrollment No."},
                "court_name":            {"type": "string", "title": "Court Name"},
                "case_number":           {"type": "string", "title": "Case Number"},
                "case_year":             {"type": "string", "title": "Year"},
                "opposing_party":        {"type": "string", "title": "Opposing Party Name"},
                "case_type":             {"type": "string", "title": "Case Type (WP, CMA, CRL, etc.)"},
            },
        },
        "system_prompt": (
            "You are an expert Indian lawyer. Draft a formal Vakalatnama (Power of Attorney to plead) "
            "authorizing the named advocate to appear, plead, and act for the client in the named case. "
            "Follow standard Indian court Vakalatnama format with all required clauses. "
            "Include: parties, court, case details, powers granted, signature block. "
            "Output only the document — no commentary. Use the language requested."
        ),
    },
    {
        "name": "General Affidavit",
        "slug": "affidavit-general",
        "description": "Sworn affidavit for general purposes — address proof, name change, income declaration, etc.",
        "doc_type": "affidavit_general",
        "supported_languages": ["ta", "en", "hi", "te"],
        "is_premium": False,
        "form_schema": {
            "type": "object",
            "required": ["deponent_name", "deponent_age", "deponent_address", "deponent_occupation", "purpose", "statement"],
            "properties": {
                "deponent_name":       {"type": "string", "title": "Deponent Full Name"},
                "deponent_age":        {"type": "number", "title": "Age"},
                "deponent_address":    {"type": "string", "title": "Deponent Address"},
                "deponent_occupation": {"type": "string", "title": "Occupation"},
                "purpose":             {"type": "string", "title": "Purpose of Affidavit (e.g. address proof, name change)"},
                "statement":           {"type": "string", "title": "Statement / Facts to be Sworn"},
                "place":               {"type": "string", "title": "Place of Execution"},
            },
        },
        "system_prompt": (
            "You are an expert Indian lawyer. Draft a formal sworn affidavit following Indian legal conventions. "
            "Include: title ('AFFIDAVIT'), deponent details, verification clause, jurat. "
            "The affidavit must be suitable for submission to government offices and courts. "
            "Output only the affidavit — no commentary. Use the language requested."
        ),
    },
    {
        "name": "Stay Petition",
        "slug": "stay-petition",
        "description": "Application for stay of operation of order / judgment pending appeal or revision.",
        "doc_type": "stay_petition",
        "supported_languages": ["ta", "en"],
        "is_premium": True,
        "form_schema": {
            "type": "object",
            "required": ["petitioner_name", "petitioner_address", "respondent_name", "court_name", "impugned_order_date", "impugned_order_court", "case_number", "grounds", "urgency"],
            "properties": {
                "petitioner_name":          {"type": "string", "title": "Petitioner Name"},
                "petitioner_address":       {"type": "string", "title": "Petitioner Address"},
                "respondent_name":          {"type": "string", "title": "Respondent Name(s)"},
                "court_name":              {"type": "string", "title": "Court Where Filed"},
                "impugned_order_date":     {"type": "string", "title": "Date of Impugned Order"},
                "impugned_order_court":    {"type": "string", "title": "Court That Passed the Order"},
                "case_number":             {"type": "string", "title": "Case/Appeal Number"},
                "grounds":                 {"type": "string", "title": "Grounds for Stay"},
                "urgency":                 {"type": "string", "title": "Urgency / Irreparable Harm"},
                "undertaking":             {"type": "string", "title": "Undertaking Offered (if any)"},
            },
        },
        "system_prompt": (
            "You are a senior appellate advocate in Indian courts. "
            "Draft a persuasive stay petition/application following High Court/Supreme Court format. "
            "Include: court heading, parties, case details, grounds (prima facie case, balance of convenience, irreparable harm), prayer. "
            "Arguments should be legally sound and cite the three-pronged test for grant of stay. "
            "Output only the petition — no explanation. Use the language requested."
        ),
    },
    {
        "name": "Power of Attorney (General)",
        "slug": "power-of-attorney",
        "description": "General Power of Attorney authorizing an agent to act on behalf of the principal.",
        "doc_type": "power_of_attorney",
        "supported_languages": ["ta", "en", "hi"],
        "is_premium": False,
        "form_schema": {
            "type": "object",
            "required": ["principal_name", "principal_address", "agent_name", "agent_address", "agent_relationship", "powers_granted", "duration"],
            "properties": {
                "principal_name":      {"type": "string", "title": "Principal (Grantor) Full Name"},
                "principal_address":   {"type": "string", "title": "Principal Address"},
                "agent_name":          {"type": "string", "title": "Agent (Holder) Full Name"},
                "agent_address":       {"type": "string", "title": "Agent Address"},
                "agent_relationship":  {"type": "string", "title": "Relationship with Principal"},
                "powers_granted":      {"type": "string", "title": "Specific Powers Granted"},
                "duration":            {"type": "string", "title": "Duration / Validity (e.g. 1 year, permanent)"},
                "property_details":    {"type": "string", "title": "Property / Subject Details (if specific)"},
            },
        },
        "system_prompt": (
            "You are an expert Indian conveyancing and property lawyer. "
            "Draft a legally valid General Power of Attorney following Indian law (Powers of Attorney Act, 1882). "
            "Include: parties, recitals, scope of authority, duration, revocation clause, execution/attestation block. "
            "Output only the document — no commentary. Use the language requested."
        ),
    },
    {
        "name": "Cheque Bounce Notice",
        "slug": "cheque-bounce-notice",
        "description": "Statutory demand notice under Section 138 of the Negotiable Instruments Act for dishonoured cheque.",
        "doc_type": "cheque_bounce_notice",
        "supported_languages": ["ta", "en", "hi", "te"],
        "is_premium": False,
        "form_schema": {
            "type": "object",
            "required": ["payee_name", "payee_address", "drawer_name", "drawer_address", "cheque_number", "cheque_date", "cheque_amount", "bank_name", "dishonour_date", "dishonour_reason"],
            "properties": {
                "payee_name":         {"type": "string", "title": "Payee (Notice Sender) Name"},
                "payee_address":      {"type": "string", "title": "Payee Address"},
                "drawer_name":        {"type": "string", "title": "Drawer (Accused) Name"},
                "drawer_address":     {"type": "string", "title": "Drawer Address"},
                "cheque_number":      {"type": "string", "title": "Cheque Number"},
                "cheque_date":        {"type": "string", "title": "Cheque Date"},
                "cheque_amount":      {"type": "number", "title": "Cheque Amount (₹)"},
                "bank_name":          {"type": "string", "title": "Bank & Branch Name"},
                "dishonour_date":     {"type": "string", "title": "Date of Dishonour"},
                "dishonour_reason":   {"type": "string", "title": "Reason for Dishonour (as per memo)"},
            },
        },
        "system_prompt": (
            "You are an expert in Indian negotiable instruments law (NI Act, 1881). "
            "Draft a statutory legal notice under Section 138 of the Negotiable Instruments Act. "
            "The notice must: state facts clearly, mention the 30-day demand period, warn of criminal prosecution under S.138 NI Act if payment is not made. "
            "This notice is time-sensitive and legally critical — every clause must be precise. "
            "Output only the notice — no explanation. Use the language requested."
        ),
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        for t in TEMPLATES:
            result = await db.execute(select(Template).where(Template.slug == t["slug"]))
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  skip  {t['slug']} (already exists)")
                continue
            db.add(Template(**t))
            print(f"  added {t['slug']}")
        await db.commit()
        print("\nDone. Templates seeded.")


asyncio.run(seed())
