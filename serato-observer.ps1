# ============================================================
# DJ LIVE - SERATO OBSERVER V1.5
# ============================================================
# Purpose:
#   Watches the fixed Serato DJ Pro Deck 1 and Deck 2
#   title/artist regions on the Tipsys Serato PC.
#
# V1.5:
#   - Captures Deck 1 and Deck 2 automatically
#   - OCRs both regions using Windows built-in OCR
#   - Only captures while Serato DJ Pro is the foreground app
#   - Requires 2 consecutive matching OCR readings before
#     accepting a deck change
#   - Silently ignores empty OCR frames
#
# V1.5 DOES NOT:
#   - Contact DJ Live
#   - Modify requests
#   - Call serato-bridge.js
#
# Tipsys Serato display tested at:
#   1918 x 1078
#
# Verified capture regions:
#   Deck 1: X=96,   Y=108, W=390, H=54
#   Deck 2: X=1304, Y=108, W=390, H=54
# ============================================================


# -----------------------------
# SETTINGS
# -----------------------------

$PollMilliseconds = 1000
$RequiredStableReads = 2

$Deck1 = @{
    X = 96
    Y = 108
    Width = 390
    Height = 54
}

$Deck2 = @{
    X = 1304
    Y = 108
    Width = 390
    Height = 54
}


# -----------------------------
# LOAD WINDOWS COMPONENTS
# -----------------------------

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Runtime.WindowsRuntime

[void][Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
[void][Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
[void][Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType=WindowsRuntime]


# -----------------------------
# WINDOWS FOREGROUND-WINDOW API
# -----------------------------

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class DJLiveWindowTools
{
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(
        IntPtr hWnd,
        out uint processId
    );
}
"@


# -----------------------------
# CHECK WHETHER SERATO IS FOREGROUND
# -----------------------------

function Test-SeratoForeground {

    try {
        $handle = [DJLiveWindowTools]::GetForegroundWindow()

        if ($handle -eq [IntPtr]::Zero) {
            return $false
        }

        [uint32]$processId = 0

        [void][DJLiveWindowTools]::GetWindowThreadProcessId(
            $handle,
            [ref]$processId
        )

        if ($processId -eq 0) {
            return $false
        }

        $process = Get-Process `
            -Id $processId `
            -ErrorAction SilentlyContinue

        if (-not $process) {
            return $false
        }

        return (
            $process.ProcessName -like "*Serato*"
        )
    }
    catch {
        return $false
    }
}


# -----------------------------
# FIND WinRT AsTask()
# -----------------------------

$script:AsTaskMethod = @(
    [System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object {
        $_.Name -eq "AsTask" -and
        $_.IsGenericMethod -and
        $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    }
) | Select-Object -First 1

if (-not $script:AsTaskMethod) {
    throw "DJ Live could not initialize Windows Runtime async support."
}


# -----------------------------
# WINDOWS OCR ENGINE
# -----------------------------

$script:OcrEngine =
    [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()

if (-not $script:OcrEngine) {
    throw "DJ Live could not initialize the Windows OCR engine."
}


# -----------------------------
# WinRT ASYNC HELPER
# -----------------------------

function Wait-WinRT {
    param(
        [Parameter(Mandatory = $true)]
        $Operation,

        [Parameter(Mandatory = $true)]
        [Type]$ResultType
    )

    $method = $script:AsTaskMethod.MakeGenericMethod($ResultType)
    $task = $method.Invoke($null, @($Operation))

    $task.Wait()

    return $task.Result
}


# -----------------------------
# CAPTURE A SCREEN REGION
# -----------------------------

function Capture-DeckRegion {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Region,

        [Parameter(Mandatory = $true)]
        [string]$OutputPath
    )

    $bitmap = New-Object System.Drawing.Bitmap(
        $Region.Width,
        $Region.Height
    )

    $graphics =
        [System.Drawing.Graphics]::FromImage($bitmap)

    try {
        $graphics.CopyFromScreen(
            $Region.X,
            $Region.Y,
            0,
            0,
            $bitmap.Size
        )

        $bitmap.Save(
            $OutputPath,
            [System.Drawing.Imaging.ImageFormat]::Png
        )
    }
    finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}


# -----------------------------
# OCR AN IMAGE FILE
# -----------------------------

function Read-ImageText {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ImagePath
    )

    $fileOperation =
        [Windows.Storage.StorageFile]::GetFileFromPathAsync(
            $ImagePath
        )

    $file = Wait-WinRT `
        -Operation $fileOperation `
        -ResultType ([Windows.Storage.StorageFile])

    $streamOperation =
        $file.OpenAsync(
            [Windows.Storage.FileAccessMode]::Read
        )

    $stream = Wait-WinRT `
        -Operation $streamOperation `
        -ResultType ([Windows.Storage.Streams.IRandomAccessStream])

    try {
        $decoderOperation =
            [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync(
                $stream
            )

        $decoder = Wait-WinRT `
            -Operation $decoderOperation `
            -ResultType ([Windows.Graphics.Imaging.BitmapDecoder])

        $bitmapOperation =
            $decoder.GetSoftwareBitmapAsync()

        $softwareBitmap = Wait-WinRT `
            -Operation $bitmapOperation `
            -ResultType ([Windows.Graphics.Imaging.SoftwareBitmap])

        try {
            $ocrOperation =
                $script:OcrEngine.RecognizeAsync(
                    $softwareBitmap
                )

            $ocrResult = Wait-WinRT `
                -Operation $ocrOperation `
                -ResultType ([Windows.Media.Ocr.OcrResult])

            if ($null -eq $ocrResult) {
                return ""
            }

            return $ocrResult.Text.Trim()
        }
        finally {
            if ($softwareBitmap) {
                $softwareBitmap.Dispose()
            }
        }
    }
    finally {
        if ($stream) {
            $stream.Dispose()
        }
    }
}


# -----------------------------
# READ A SERATO DECK
# -----------------------------

function Read-SeratoDeck {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Region,

        [Parameter(Mandatory = $true)]
        [string]$ImagePath
    )

    Capture-DeckRegion `
        -Region $Region `
        -OutputPath $ImagePath

    return Read-ImageText `
        -ImagePath $ImagePath
}


# -----------------------------
# STABLE CHANGE DETECTOR
# -----------------------------

function Test-DeckReading {
    param(
        [Parameter(Mandatory = $true)]
        [int]$DeckNumber,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$CurrentReading
    )

    if ([string]::IsNullOrWhiteSpace($CurrentReading)) {
        return
    }

    if ($DeckNumber -eq 1) {
        $LastAccepted = $script:LastDeck1
        $Candidate = $script:CandidateDeck1
        $CandidateCount = $script:CandidateDeck1Count
    }
    else {
        $LastAccepted = $script:LastDeck2
        $Candidate = $script:CandidateDeck2
        $CandidateCount = $script:CandidateDeck2Count
    }


    # Reading matches the accepted track.
    # Clear any pending candidate.
    if ($CurrentReading -eq $LastAccepted) {

        if ($DeckNumber -eq 1) {
            $script:CandidateDeck1 = ""
            $script:CandidateDeck1Count = 0
        }
        else {
            $script:CandidateDeck2 = ""
            $script:CandidateDeck2Count = 0
        }

        return
    }


    # Same candidate appeared again.
    if ($CurrentReading -eq $Candidate) {
        $CandidateCount++
    }
    else {
        $Candidate = $CurrentReading
        $CandidateCount = 1
    }


    # Save candidate state.
    if ($DeckNumber -eq 1) {
        $script:CandidateDeck1 = $Candidate
        $script:CandidateDeck1Count = $CandidateCount
    }
    else {
        $script:CandidateDeck2 = $Candidate
        $script:CandidateDeck2Count = $CandidateCount
    }


    # Candidate is not stable enough yet.
    if ($CandidateCount -lt $RequiredStableReads) {
        return
    }


    # Accept stable change.
    Write-Host ""
    Write-Host "--------------------------------------------"
    Write-Host "DECK $DeckNumber CHANGED"
    Write-Host "OLD: $LastAccepted"
    Write-Host "NEW: $Candidate"
    Write-Host "--------------------------------------------"
    Write-Host ""


    if ($DeckNumber -eq 1) {
        $script:LastDeck1 = $Candidate
        $script:CandidateDeck1 = ""
        $script:CandidateDeck1Count = 0
    }
    else {
        $script:LastDeck2 = $Candidate
        $script:CandidateDeck2 = ""
        $script:CandidateDeck2Count = 0
    }
}


# -----------------------------
# TEMP IMAGE PATHS
# -----------------------------

$TempFolder = Join-Path `
    $env:TEMP `
    "DJLive-SeratoObserver"

if (-not (Test-Path $TempFolder)) {
    New-Item `
        -ItemType Directory `
        -Path $TempFolder `
        -Force |
        Out-Null
}

$Deck1Image = Join-Path `
    $TempFolder `
    "deck1.png"

$Deck2Image = Join-Path `
    $TempFolder `
    "deck2.png"


# -----------------------------
# STARTUP
# -----------------------------

Clear-Host

Write-Host ""
Write-Host "============================================"
Write-Host "       DJ LIVE - SERATO OBSERVER V1.5"
Write-Host "============================================"
Write-Host ""
Write-Host "Tipsys Serato observer starting..."
Write-Host ""
Write-Host "Deck 1 region: X=96 Y=108 W=390 H=54"
Write-Host "Deck 2 region: X=1304 Y=108 W=390 H=54"
Write-Host ""
Write-Host "Stable reads required: $RequiredStableReads"
Write-Host ""
Write-Host "Waiting for Serato DJ Pro to be foreground..."
Write-Host ""


# -----------------------------
# WAIT FOR SERATO BEFORE
# INITIAL DECK READ
# -----------------------------

while (-not (Test-SeratoForeground)) {
    Start-Sleep -Milliseconds 250
}


try {
    $script:LastDeck1 = Read-SeratoDeck `
        -Region $Deck1 `
        -ImagePath $Deck1Image

    $script:LastDeck2 = Read-SeratoDeck `
        -Region $Deck2 `
        -ImagePath $Deck2Image
}
catch {
    Write-Host ""
    Write-Host "OBSERVER STARTUP ERROR:"
    Write-Host $_.Exception.Message
    Write-Host ""
    exit 1
}


$script:CandidateDeck1 = ""
$script:CandidateDeck1Count = 0

$script:CandidateDeck2 = ""
$script:CandidateDeck2Count = 0


Write-Host "Initial Serato deck state captured."
Write-Host "Deck 1: $script:LastDeck1"
Write-Host "Deck 2: $script:LastDeck2"
Write-Host ""
Write-Host "WATCHING SERATO..."
Write-Host "Observer pauses automatically when Serato is not foreground."
Write-Host "Press CTRL+C to stop."
Write-Host ""


# -----------------------------
# CONTINUOUS OBSERVER LOOP
# -----------------------------

while ($true) {

    # Do not capture the screen while another application
    # is covering Serato.
    if (-not (Test-SeratoForeground)) {

        # Discard any half-confirmed OCR candidate.
        # When Serato returns, confirmation starts cleanly.
        $script:CandidateDeck1 = ""
        $script:CandidateDeck1Count = 0

        $script:CandidateDeck2 = ""
        $script:CandidateDeck2Count = 0

        Start-Sleep -Milliseconds 250
        continue
    }


    try {

        # ---- DECK 1 ----

        $CurrentDeck1 = Read-SeratoDeck `
            -Region $Deck1 `
            -ImagePath $Deck1Image

        Test-DeckReading `
            -DeckNumber 1 `
            -CurrentReading $CurrentDeck1


        # If the foreground app changed while Deck 1
        # was being processed, do not continue to Deck 2.
        if (-not (Test-SeratoForeground)) {
            Start-Sleep -Milliseconds 250
            continue
        }


        # ---- DECK 2 ----

        $CurrentDeck2 = Read-SeratoDeck `
            -Region $Deck2 `
            -ImagePath $Deck2Image

        Test-DeckReading `
            -DeckNumber 2 `
            -CurrentReading $CurrentDeck2

    }
    catch {
        Write-Host ""
        Write-Host "Observer warning: $($_.Exception.Message)"
        Write-Host "Continuing..."
        Write-Host ""
    }

    Start-Sleep -Milliseconds $PollMilliseconds
}