//!import "AtlasHelp.js"
//
// DualClustering.js
// Cluster the rows and columns of a number table of the parent data view.
//

ValidateHeatMap(pp);

function DoClustering(map, minSize, minPoint) {
	// Setup context menu to synchronize clusters with the heatmap.
	var menuScript = "!cs.CopyType(pp, cfg.hm);";
	var imgPath = "C:\\Program Files\\VisuMap Technologies\\VisuMap5\\resource\\icon\\PartitionA.png";
	var menuTip = "Push the cluster coloring to the heatmap";
	var menuLabel = "Capture Coloring";
	map.AddContextMenu(menuLabel, menuScript, null, imgPath, menuTip);

	map.ClusterAlgorithm = 1;
	map.MinClusterSize = minSize;
	map.MinClusterPoint = minPoint;
	map.DoDataClustering();
	return map.Clusters;
}

function DCMain() {
	cfg.hm = pp;
	var nt = cfg.hm.GetNumberTable();
	var cellMap = vv.FindWindow("Cell Map");
	var geneMap = vv.FindWindow("Gene Map");
	
	if ( (cellMap==null) || (geneMap==null) ) {
		vv.Message("Cell/Gene map not present!\nPlease run DualClustering!");
		vv.Return();
	}

	var rowClusters = DoClustering(cellMap, cfg.cMinSize, cfg.cMinPoint);
	cs.NormalizeColoring(cellMap.BodyList, cfg.RowSortingKeys, rowClusters);
	cellMap.ClickContextMenu("Capture Coloring");

	var colClusters = DoClustering(geneMap, cfg.gMinSize, cfg.gMinSize);
	cs.NormalizeColoring(geneMap.BodyList, cfg.ColumnSortingKeys, colClusters);
	geneMap.ClickContextMenu("Capture Coloring");

	cfg.hm.Title = "Row/Column Clusters: " + rowClusters + "/" + colClusters;

	/*
	cfg.hm.ClickContextMenu("Utilities/Sort Columns on Type");
	cfg.hm.ClickContextMenu("Utilities/Sort Rows on Type");
	*/	
}

DCMain();
