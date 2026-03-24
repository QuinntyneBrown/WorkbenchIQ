"""Check ALL apps on cloud for batch_summaries."""
import urllib.request, json, ssl

ctx = ssl.create_default_context()
url = "https://workbenchiq-api.azurewebsites.net/api/applications"
req = urllib.request.Request(url)
with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
    apps = json.loads(resp.read())

print(f"Total apps: {len(apps)}")
for app in apps:
    aid = app.get("id", "?")
    bs = app.get("batch_summaries")
    mode = app.get("processing_mode")
    bs_count = len(bs) if isinstance(bs, list) else "None"
    if bs_count != "None":
        print(f"  {aid}: mode={mode} batch_summaries={bs_count}")

# Also check: does the list endpoint even include batch_summaries?
sample = apps[0] if apps else {}
print(f"\nKeys in list response: {sorted(sample.keys())}")
has_bs_key = "batch_summaries" in sample
print(f"batch_summaries key present in list: {has_bs_key}")
