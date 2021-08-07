/*
DualSorting.js

Description: Context menu script to perform dual sorting on a heatmap.

To install Single-Cell-Atlas related menus mark and run the following statements:

vv.GuiManager.SetCustomMenu("Atlas/Import Loom", true, vv.CurrentScriptDirectory + "/LoomRead.pyn", "MainForm");
vv.GuiManager.SetCustomMenu("Atlas/Import H5AD", true, vv.CurrentScriptDirectory + "/H5adRead.pyn", "MainForm");
vv.GuiManager.SetCustomMenu("Atlas/Import H5", true, vv.CurrentScriptDirectory + "/H5Read.pyn", "MainForm");
vv.GuiManager.SetCustomMenu("Atlas/Dual Sorting", true, vv.CurrentScriptDirectory + "/DualSorting.js", "HeatMap");
vv.GuiManager.SetCustomMenu("Atlas/Dual Clustering", true, vv.CurrentScriptDirectory + "/DualClustering.js", "HeatMap");

To remove the menus:

vv.GuiManager.RemoveCustomMenu("Atlas/");
*/

var doClustering = vv.ModifierKeys.ControlPressed;

if (pp.Name != "HeatMap"){
  vv.Message('Please call this script from the context menu of a heatmap view.');
  vv.Return(0);
}

var RowSortingKeys, ColumnSortingKeys;

function SortTable(T, mt, epochs, ex, pr) {
	var tsne = New.TsneSorter(T, mt);
	tsne.MaxLoops = epochs;
	tsne.InitExaggeration = ex;
	tsne.PerplexityRatio = pr;
	tsne.RefreshFreq = 50;
	tsne.Show().Start();
	if (isNaN(tsne.ItemList[0].Value)) {
		vv.Message("Training degraded!\nPlease try with smaller initial exaggeration.");
		vv.Return(1);
	}
	if (pp.SelectionMode == 0)
		RowSortingKeys = tsne.ItemList;
	else
		ColumnSortingKeys = tsne.ItemList;
	tsne.Close();
}

function DSMain() {
	var mtrList = [ "Correlation.Cosine Distance", "EuclideanMetric", "Correlation.Standard Correlation"];
	pp.DisableReorder = false;
	var dsTable = pp.GetNumberTable();
	
	pp.Title = 'Sorting Rows...';
	pp.SelectionMode = 0;
	SortTable(dsTable, mtrList[0], 5000, 6.0, 0.1);
	
	pp.Title = 'Sorting Columns...';
	pp.SelectionMode = 1;
	var dsTable2 = dsTable.Transpose2();
	SortTable(dsTable2, mtrList[0], 5000, 4.0, 0.1);	
	pp.Title = 'Sorting Completed!';	
	pp.DisableReorder = true;
}

DSMain();

if (doClustering) 
  pp.ClickContextMenu("Atlas/Dual Clustering");
