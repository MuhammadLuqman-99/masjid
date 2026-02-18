Set oWS = WScript.CreateObject("WScript.Shell")
sStartup = oWS.SpecialFolders("Startup")
Set oLink = oWS.CreateShortcut(sStartup & "\Surau Desa Murni.lnk")
oLink.TargetPath = oWS.CurrentDirectory & "\start-masjid.bat"
oLink.WorkingDirectory = oWS.CurrentDirectory
oLink.Description = "Auto-start Paparan Waktu Solat"
oLink.WindowStyle = 7
oLink.Save
