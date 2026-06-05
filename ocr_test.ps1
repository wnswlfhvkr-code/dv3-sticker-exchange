# Windows 내장 OCR API를 로드하기 위한 어셈블리 선언
[void][System.Reflection.Assembly]::LoadWithPartialName("System.Runtime.WindowsRuntime")
$OcrEngineType = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime]

# 한글 언어 팩 지원 확인 및 OCR 엔진 생성
$language = New-Object Windows.Globalization.Language("ko-KR")
if (![Windows.Media.Ocr.OcrEngine]::IsLanguageSupported($language)) {
    Write-Host "⚠️ 한글 OCR 언어팩이 시스템에 없습니다. 기본 엔진을 사용합니다."
    $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
} else {
    $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
}

# 이미지 파일 로드 함수
function Get-OcrText($imagePath) {
    $file = Get-Item $imagePath
    $stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    $fileStream = [System.IO.File]::OpenRead($file.FullName)
    $buffer = New-Object byte[] $fileStream.Length
    $fileStream.Read($buffer, 0, $buffer.Length) | Out-Null
    $fileStream.Close()
    
    # 스트림에 쓰기
    $writer = [Windows.Storage.Streams.DataWriter]::new($stream)
    $writer.WriteBytes($buffer)
    [void]$writer.StoreAsync().GetResults()
    [void]$writer.FlushAsync().GetResults()
    $stream.Seek(0)
    
    # 비트맵 디코더 생성
    $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetResults()
    $softwareBitmap = $decoder.GetSoftwareBitmapAsync().GetResults()
    
    # OCR 실행
    $ocrResult = $ocrEngine.RecognizeAsync($softwareBitmap).GetResults()
    return $ocrResult.Lines | ForEach-Object { $_.Text }
}

# 나른한 오전 캡쳐본(20.png) 테스트 실행
$testPath = "c:\Antigravity\카드교환소\이미지\KakaoTalk_20260604_202516419_20.png"
Write-Host "Reading $testPath..."
$lines = Get-OcrText $testPath
$lines | Out-File -FilePath "ocr_result_20.txt" -Encoding utf8
Write-Host "Done! Saved to ocr_result_20.txt"
