//!import "AtlasHelp.js"
/*
DualSorting.js

Description: Context menu script to perform dual sorting on a heatmap.

To install Single-Cell-Atlas related menus mark and run the following statements:

for(var [label, script, view] of [ 
	["Import Loom", "LoomRead.pyn", "MainForm"],
	["Import H5AD", "H5adRead.pyn", "MainForm"],
	["Import H5", "H5Read.pyn", "MainForm"],
	["Import Matrix", "MatrixRead.pyn", "MainForm"],
	["Dual Sorting", "DualSorting.js", "HeatMap"],
	["Dual Clustering", "DualClustering.js", "HeatMap"],
	["Active Genes", "ShowActiveGenes.js", "HeatMap"]
])
	vv.GuiManager.SetCustomMenu("Atlas/" + label, true, vv.CurrentScriptDirectory + "/" + script, view);

To remove the menus:

vv.GuiManager.RemoveCustomMenu("Atlas/");
*/


var doClustering = vv.ModifierKeys.ControlPressed;

if (pp.Name != "HeatMap"){
  vv.Message('Please call this script from the context menu of a heatmap view.');
  vv.Return(0);
}

var RowSortingKeys, ColumnSortingKeys;

function DSMain() {
	var mtr = {'cos':'Correlation.Cosine Distance', 'euc':'EuclideanMetric', 'cor':'Correlation.Standard Correlation'};
	pp.DisableReorder = false;
	var dsTable = pp.GetNumberTable();
	
	pp.Title = 'Sorting Rows...';
	pp.SelectionMode = 0;
	SortTable(dsTable, mtr.cos, 5000, 6, 0.1);
	
	pp.Title = 'Sorting Columns...';
	pp.SelectionMode = 1;
	var dsTable2 = dsTable.Transpose2();
	cs.ShiftTable(dsTable2, 1.0);
	SortTable(dsTable2, mtr.cos, 5000, 4, 0.1);	
       dsTable2.FreeRef();
	pp.Title = 'Sorting Completed!';	
	pp.DisableReorder = true;
}

DSMain();

if (doClustering) 
  pp.ClickContextMenu("Atlas/Dual Clustering");
