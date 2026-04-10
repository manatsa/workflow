Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strDir

' Run database setup on first launch
If Not fso.FileExists(strDir & "\.initialized") Then
    WshShell.Run "cmd /c """ & strDir & "\setup-db.bat"" && echo. > """ & strDir & "\.initialized""", 1, True
End If

' Start the application hidden (no console window)
WshShell.Run "javaw -jar workflow-system-1.5.0.jar", 0, False

' Open browser after a short delay
WScript.Sleep 8000
WshShell.Run "http://localhost:9500", 1, False
