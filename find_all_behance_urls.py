import re

input_path = r"C:\Users\luisi\.gemini\antigravity\brain\5a1a94a6-4df9-4458-a95f-4e6165f5638f\.system_generated\steps\8\content.md"

with open(input_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find any URL matching mir-s3-cdn-cf.behance.net
behance_urls = set(re.findall(r'https://mir-s3-cdn-cf\.behance\.net/[^\s\'\"]+', content))

print("Found Behance URLs:")
for url in sorted(behance_urls):
    print(url)
