#!/usr/bin/env python3
"""
Verify deep dive subsections for an application.

This script fetches application data and displays which deep dive subsections
and other analysis sections are present in the application's LLM outputs.
"""

import argparse
import os
import sys

import requests


def main(base_url: str, application_id: str) -> None:
    """
    Fetch and display deep dive information for a given application.
    
    Args:
        base_url: Base URL of the API service (e.g. http://localhost:8000)
        application_id: Application identifier to query
    """
    url = f"{base_url.rstrip('/')}/api/applications/{application_id}"
    
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching application: {e}", file=sys.stderr)
        sys.exit(1)
    
    data = resp.json()
    
    print('Status:', data.get('processing_status') or data.get('status') or 'unknown')
    
    print('\nDeep dive subsections present:')
    ms = data.get('llm_outputs', {}).get('medical_summary', {})
    deep_dive = [
        'body_system_review',
        'pending_investigations',
        'last_office_visit',
        'abnormal_labs',
        'latest_vitals',
    ]
    for k in deep_dive:
        print(f'  {k}: {"YES" if k in ms else "NO"}')
    
    print('\nOther medical_summary subsections:')
    others = [
        'family_history',
        'hypertension',
        'high_cholesterol',
        'other_medical_findings',
        'other_risks',
    ]
    for k in others:
        print(f'  {k}: {"YES" if k in ms else "NO"}')
    
    print('\nOther sections:')
    app_summary = data.get('llm_outputs', {}).get('application_summary', {})
    print('  customer_profile:', 'YES' if 'customer_profile' in app_summary else 'NO')
    print('  existing_policies:', 'YES' if 'existing_policies' in app_summary else 'NO')
    
    reqs = data.get('llm_outputs', {}).get('requirements', {})
    print('  requirements_summary:', 'YES' if 'requirements_summary' in reqs else 'NO')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Verify deep dive subsections for an application.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--base-url",
        default=os.environ.get("DEEP_DIVE_BASE_URL", "http://localhost:8000"),
        help="Base URL for the API service",
    )
    parser.add_argument(
        "--application-id",
        default=os.environ.get("DEEP_DIVE_APPLICATION_ID", "456fe348"),
        help="Application ID to query",
    )
    args = parser.parse_args()
    
    main(args.base_url, args.application_id)
