$files = Get-ChildItem -Path . -Filter *.tsx
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace 'from "@/components/ui/([^"]+)"', 'from "./ui/$1"'
    $content = $content -replace 'from "@/hooks/([^"]+)"', 'from "../hooks/$1"'
    $content = $content -replace 'from "@/lib/([^"]+)"', 'from "../lib/$1"'
    $content = $content -replace 'from "@/types"', 'from "../types"'
    Set-Content $file.FullName $content
} 