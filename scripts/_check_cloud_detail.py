"""Check individual apps on cloud for batch_summaries."""
import urllib.request, json, ssl

ctx = ssl.create_default_context()

# First get the list to find apps
url = "https://workbenchiq-api.azurewebsites.net/api/applications"
req = urllib.request.Request(url)
with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
    apps = json.loads(resp.read())

# Check first 15 apps individually
batch_found = []
for app in apps[:20]:
    aid = app["id"]
    detail_url = f"https://workbenchiq-api.azurewebsites.net/api/applications/{aid}"
    req2 = urllib.request.Request(detail_url)
    with urllib.request.urlopen(req2, context=ctx, timeout=30) as resp2:
        detail = json.loads(resp2.read())
    bs = detail.get("batch_summaries")
    mode = detail.get("processing_mode")
    cc = bool(detail.get("condensed_context"))
    ref = detail.get("external_reference", "")
    bs_count = len(bs) if isinstance(bs, list) else "None"
    if mode == "large_document" or bs_count != "None" or cc:
        print(f"{aid} ({ref}): mode={mode} batch={bs_count} condensed={cc}")
        if bs_count != "None":
            batch_found.append(aid)

print(f"\nApps with batch_summaries: {len(batch_found)}")
