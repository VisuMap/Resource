def PromptFile( filter ):
	import clr
	clr.AddReference("System.Windows.Forms")
	from System.Windows.Forms import OpenFileDialog
	fd = OpenFileDialog()
	fd.Filter = filter
	fd.ShowDialog()
	return fd.FileName
