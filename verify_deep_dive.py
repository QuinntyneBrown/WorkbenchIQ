import requests

resp = requests.get('http://localhost:8000/api/applications/456fe348')
data = resp.json()

print('Status:', data.get('processing_status'))
print('\nDeep dive subsections present:')
ms = data.get('llm_outputs', {}).get('medical_summary', {})
deep_dive = ['body_system_review', 'pending_investigations', 'last_office_visit', 'abnormal_labs', 'latest_vitals']
for k in deep_dive:
    print(f'  {k}: {"YES" if k in ms else "NO"}')

print('\nOther medical_summary subsections:')
others = ['family_history', 'hypertension', 'high_cholesterol', 'other_medical_findings', 'other_risks']
for k in others:
    print(f'  {k}: {"YES" if k in ms else "NO"}')

print('\nOther sections:')
app_summary = data.get('llm_outputs', {}).get('application_summary', {})
print('  customer_profile:', 'YES' if 'customer_profile' in app_summary else 'NO')
print('  existing_policies:', 'YES' if 'existing_policies' in app_summary else 'NO')

reqs = data.get('llm_outputs', {}).get('requirements', {})
print('  requirements_summary:', 'YES' if 'requirements_summary' in reqs else 'NO')
