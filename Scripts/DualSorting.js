//!import "AtlasHelp.js"
// 
// DualSorting.js
// Context menu script to perform dual sorting on a heatmap.

var doClustering = vv.ModifierKeys.ControlPressed;

if (pp.Name != "HeatMap"){
  vv.Message('Please call this script from the context menu of a heatmap view.');
  vv.Return(0);
}

var RowSortingKeys, ColumnSortingKeys;

function DSMain() {
	pp.DisableReorder = false;
	var dsTable = pp.GetNumberTable();
	
	pp.Title = 'Sorting Rows...';
	pp.SelectionMode = 0;
	SortTable(dsTable, cfg.cMtr, cfg.cEpochs, 6, cfg.cPpr);
	
	pp.Title = 'Sorting Columns...';
	pp.SelectionMode = 1;
	var dsTable2 = dsTable.Transpose2();
	cs.ShiftTable(dsTable2, cfg.gPrShift);
	SortTable(dsTable2, cfg.gMtr, cfg.gEpochs, 4, cfg.gPpr);
       dsTable2.FreeRef();
	pp.Title = 'Sorting Completed!';	
	pp.DisableReorder = true;
}

DSMain();

if (doClustering) 
  pp.ClickContextMenu("Atlas/Dual Clustering");
