import re

input_path = r"C:\Users\luisi\.gemini\antigravity\brain\5a1a94a6-4df9-4458-a95f-4e6165f5638f\.system_generated\steps\8\content.md"
output_path = r"c:\Users\luisi\Projects\devtracker\extracted_behance_info.txt"

with open(input_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find project modules URLs
urls = sorted(set(re.findall(r'https://mir-s3-cdn-cf\.behance\.net/project_modules/[^\s\'\"]+', content)))

# Find any text paragraphs or headers
# Behance text components are usually within div with class project-text-component or in JSON metadata
# Let's search for some text patterns
text_blocks = re.findall(r'<p[^>]*>(.*?)</p>', content)
clean_text = []
for block in text_blocks:
    # strip HTML tags
    text = re.sub(r'<[^>]+>', '', block).strip()
    if len(text) > 20:
        clean_text.append(text)

with open(output_path, "w", encoding="utf-8") as out:
    out.write("--- IMAGE URLS ---\n")
    for url in urls:
        out.write(url + "\n")
    out.write("\n--- TEXT BLOCKS ---\n")
    for t in sorted(set(clean_text))[:30]:
        out.write(t + "\n")

print(f"Extracted {len(urls)} URLs and {len(clean_text)} text blocks.")
