// Install Single-Cell-Atlas related menus mark and run the following statements
//
// To remove the menu:
// 
// vv.GuiManager.RemoveCustomMenu("Atlas/");
//

for(var [label, script, view] of [ 
	["Import Loom", "LoomRead.pyn", "MainForm"],
	["Import H5AD", "H5adRead.pyn", "MainForm"],
	["Import H5", "H5Read.pyn", "MainForm"],
	["Import Matrix", "MatrixRead.pyn", "MainForm"],
	["Dual Sorting", "DualSorting.js", "HeatMap"],
	["Dual Embedding", "DualEmbedding.js", "HeatMap"],
	["Dual Clustering", "DualClustering.js", "HeatMap"],
	["Active Genes", "ShowActiveGenes.js", "HeatMap"],
	["Active Cells", "ShowActiveCells.js", "HeatMap"],
])
	vv.GuiManager.SetCustomMenu("Atlas/" + label, 
		true, vv.CurrentScriptDirectory + "/" + script, view);
