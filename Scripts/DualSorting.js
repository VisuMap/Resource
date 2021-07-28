/*
DualSorting.js

Description: Context menu script to perform dual sorting on a heatmap.

To install Single-Cell-Atlas related menus mark and run the following statements:

vv.GuiManager.SetCustomMenu("Atlas/Import Loom", true, vv.CurrentScriptDirectory + "/LoomRead.pyn", "MainForm");
vv.GuiManager.SetCustomMenu("Atlas/Import H5AD", true, vv.CurrentScriptDirectory + "/H5adRead.pyn", "MainForm");
vv.GuiManager.SetCustomMenu("Atlas/Dual Sorting", true, vv.CurrentScriptDirectory + "/DualSorting.js", "HeatMap");
vv.GuiManager.SetCustomMenu("Atlas/Dual Clustering", true, vv.CurrentScriptDirectory + "/DualClustering.js", "HeatMap");

To remove the menus:

vv.GuiManager.RemoveCustomMenu("Atlas/");
*/

if (pp.Name != "HeatMap"){
  vv.Message('Please call this script from the context menu of a heatmap view.');
  vv.Return(0);
}


var RowSortingKeys, ColumnSortingKeys;

function SortTable(T, mt, epochs, ex, pr) {
	let tsne = New.TsneSorter(T, mt);
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

{
	let mtrList = [ "Correlation.Standard Correlation", "EuclideanMetric", "Correlation.Cosine Distance" ]
	pp.DisableReorder = false;
	let dsTable = pp.GetNumberTable();
	
	pp.Title = 'Sorting Rows...';
	pp.SelectionMode = 0;
	SortTable(dsTable, mtrList[2], 5000, 12.0, 0.1);
	
	dsTable = dsTable.Transpose2();
	pp.Title = 'Sorting Columns...';
	pp.SelectionMode = 1;
	SortTable(dsTable, mtrList[2], 5000, 4.0, 0.1);
	
	pp.DisableReorder = true;
}

