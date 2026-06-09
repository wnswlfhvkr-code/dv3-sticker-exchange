from bs4 import BeautifulSoup
import re
import json

try:
    with open("withhive_content.html", "r", encoding="utf-8") as f:
        html = f.read()
        
    soup = BeautifulSoup(html, "html.parser")
    
    # 게시글 본문 영역 찾기 (div.post_cont 또는 div.post_cont_inner 등)
    post_cont = soup.select_one("div.post_cont")
    if not post_cont:
        # 다른 클래스도 시도
        post_cont = soup.select_one("div.board_detail_cont")
        
    if post_cont:
        print("Found post body!")
        # 텍스트 추출
        text = post_cont.get_text(separator="\n")
        # 모든 한글 텍스트 및 숫자 획득
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # 유의미한 한글 목록 출력
        print("\n--- EXTRACTED TEXT LINES ---")
        for i, line in enumerate(lines[:200]):
            print(f"[{i}] {line}")
            
        # JSON 저장
        with open("parsed_text.json", "w", encoding="utf-8") as out:
            json.dump(lines, out, ensure_ascii=False, indent=2)
    else:
        print("Could not find post body div.")
        
except Exception as e:
    print(f"Error parsing HTML: {e}")
