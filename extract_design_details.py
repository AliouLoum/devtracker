import re

input_path = r"C:\Users\luisi\.gemini\antigravity\brain\5a1a94a6-4df9-4458-a95f-4e6165f5638f\.system_generated\steps\8\content.md"

with open(input_path, "r", encoding="utf-8") as f:
    content = f.read()

# Search for Hex colors (3 or 6 hex digits, ignoring standard ones like white/black if too many, or just grab all)
hex_colors = set(re.findall(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b', content))
print("Found Hex Colors (raw):", sorted(list(hex_colors))[:50])

# Search for font names
fonts = set(re.findall(r'font-family\s*:\s*([^;\}]+)', content, re.IGNORECASE))
print("\nFound Font Families:")
for font in fonts:
    print("- ", font.strip())

# Search for CSS styles related to color
color_styles = set(re.findall(r'(--[a-zA-Z0-9_-]+-color|--[a-zA-Z0-9_-]+-bg)\s*:\s*([^;\}]+)', content))
print("\nFound CSS Color Variables:")
for var, val in color_styles:
    print(f"- {var}: {val.strip()}")

# Let's search for keywords in text: "primary", "secondary", "accent", "colors", "brand", "design system"
keywords = ["color", "palette", "font", "brand", "accent", "primary", "secondary", "dark", "light"]
found_sentences = []
for line in content.split("\n"):
    if any(k in line.lower() for k in keywords) and len(line) < 200:
        found_sentences.append(line.strip())

print("\nKeywords Search (first 20 lines):")
for s in found_sentences[:20]:
    print("- ", re.sub(r'<[^>]+>', '', s)[:100])
