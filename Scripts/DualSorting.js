//!import "AtlasHelp.js"
/*
DualSorting.js

Description: Context menu script to perform dual sorting on a heatmap.

To install Single-Cell-Atlas related menus mark and run the following statements:

function AddMenu(label, script, formName) { 
	vv.GuiManager.SetCustomMenu("Atlas/" + label, true, vv.CurrentScriptDirectory + "/" + script, formName);
}
AddMenu("Import Loom", "LoomRead.pyn", "MainForm");
AddMenu("Import H5AD", "H5adRead.pyn", "MainForm");
AddMenu("Import H5", "H5Read.pyn", "MainForm");
AddMenu("Import Matrix", "MatrixRead.pyn", "MainForm");
AddMenu("Dual Sorting", "DualSorting.js", "HeatMap");
AddMenu("Dual Clustering", "DualClustering.js", "HeatMap");
AddMenu("Active Genes", "ShowActiveGenes.js", "HeatMap");

To remove the menus:

vv.GuiManager.RemoveCustomMenu("Atlas/");
*/

vv.GuiManager.Se

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
