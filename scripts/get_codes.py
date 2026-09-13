import re

with open('src/data/mockData.js', 'r', encoding='utf-8') as f:
    text = f.read()

codes = re.findall(r"code:\s*['\"]([A-Za-z0-9]+)['\"]", text)
distinct_codes = []
for c in codes:
    if c not in distinct_codes:
        distinct_codes.append(c)

print(f"Total distinct funds: {len(distinct_codes)}")
print("Python list:")
print(distinct_codes)
