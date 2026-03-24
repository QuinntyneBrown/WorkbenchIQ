"""Check batch_summaries on cloud."""
import urllib.request, json, ssl

ctx = ssl.create_default_context()
ids = ["d447db29", "3a1252fb", "50e47ac4", "dbf2549e", "0f3bf12f", "573cf289"]

for aid in ids:
    url = f"https://workbenchiq-api.azurewebsites.net/api/applications/{aid}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        data = json.loads(resp.read())
    bs = data.get("batch_summaries")
    mode = data.get("processing_mode")
    cc = bool(data.get("condensed_context"))
    ds = data.get("document_stats")
    bs_count = len(bs) if isinstance(bs, list) else "None"
    print(f"{aid}: mode={mode} batch_summaries={bs_count} condensed_context={cc} doc_stats={bool(ds)}")
