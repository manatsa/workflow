Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "javaw -jar workflow-system-1.5.0.jar", 0, False

' Open browser after a short delay
WScript.Sleep 8000
WshShell.Run "http://localhost:9500", 1, False
