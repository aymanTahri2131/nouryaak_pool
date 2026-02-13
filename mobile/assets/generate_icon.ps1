Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Users\lenevo\Desktop\ITSM\G2g-tech\aronium\aroPos\mobile\assets\NooryakBg.png"
$targetPath = "c:\Users\lenevo\Desktop\ITSM\G2g-tech\aronium\aroPos\mobile\assets\nouryaak_icon_sq.png"

# Load source image
$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)

# Create 1024x1024 canvas
$targetImg = New-Object System.Drawing.Bitmap(1024, 1024)
$graph = [System.Drawing.Graphics]::FromImage($targetImg)

# Fill with white background
$whiteBrush = [System.Drawing.Brushes]::White
$graph.FillRectangle($whiteBrush, 0, 0, 1024, 1024)

# Calculate centered position
# To ensure it fits in safe zone (660x660), we might need to scale if larger
# Current 615x406 fits perfectly in safe zone, so no scaling needed
$x = (1024 - $sourceImg.Width) / 2
$y = (1024 - $sourceImg.Height) / 2

# Draw image centered
$graph.DrawImage($sourceImg, [int]$x, [int]$y, $sourceImg.Width, $sourceImg.Height)

# Save result
$targetImg.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$sourceImg.Dispose()
$targetImg.Dispose()
$graph.Dispose()

Write-Host "Image generated successfully at $targetPath"
