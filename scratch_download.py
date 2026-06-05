import urllib.request
import re
import json

url = "https://community.withhive.com/dvc/ko/board/all/312801"

try:
    print(f"Connecting to {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    
    print("HTML downloaded successfully. Analyzing text elements...")
    
    # 임시 HTML 백업
    with open("withhive_content.html", "w", encoding="utf-8") as f:
        f.write(html)
        
    print("Saved HTML to withhive_content.html.")
except Exception as e:
    print(f"Error fetching page: {e}")
