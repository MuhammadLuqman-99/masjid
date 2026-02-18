Set oWS = WScript.CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")
Set oLink = oWS.CreateShortcut(sDesktop & "\Surau Desa Murni.lnk")
oLink.TargetPath = oWS.CurrentDirectory & "\start-masjid.bat"
oLink.WorkingDirectory = oWS.CurrentDirectory
oLink.Description = "Paparan Waktu Solat - Surau Desa Murni Gong Kapas"
oLink.WindowStyle = 7
oLink.Save
