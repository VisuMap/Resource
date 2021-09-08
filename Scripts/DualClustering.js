//!import "AtlasHelp.js"
//DualClustering.js
//
//Cluster the rows and columns of a number table of the parent data view.
//

function DoClustering(map, minSize, minPoint) {
	map.ClusterAlgorithm = 1;
	map.MinClusterSize = minSize;
	map.MinClusterPoint = minPoint;
	map.DoDataClustering();
	return map.Clusters;
}

function DCMain() {
	var hm = pp;
	var nt = hm.GetNumberTable();
	var cellMap = vv.FindWindow("Cell Map");
	var geneMap = vv.FindWindow("Gene Map");
	
	if ( (cellMap==null) || (geneMap==null) ) {
		vv.Message("Cell/Gene map not present!\nPlease run DualClustering!");
		vv.Return();
	}

	// Setup context menu to synchronize clusters with the heatmap.
	var CaptureColor = `!{
		let hm = vv.EventSource.Item;
		let nt = hm.GetNumberTable();
		cs.CopyType(pp.BodyList, (pp.Tag == 77) ? nt.RowSpecList : nt.ColumnSpecList);
		hm.Redraw();
	}`;
	[cellMap.Tag, geneMap.Tag] = [77, 88];
	for( var mp of [cellMap, geneMap] ) 
		mp.AddContextMenu("Capture Coloring", CaptureColor,  hm, 
			"C:\\Program Files\\VisuMap Technologies\\VisuMap5\\resource\\icon\\PartitionA.png", 
			"Push the cluster coloring to the heatmap");

	var rowClusters = DoClustering(cellMap, cfg.cMinSize, cfg.cMinPoint);
       if ( cfg.RowSortingKeys != null )
		cs.NormalizeColoring(cellMap.BodyList, cfg.RowSortingKeys, rowClusters);
	cellMap.ClickContextMenu("Capture Coloring");

	var colClusters = DoClustering(geneMap, cfg.gMinSize, cfg.gMinSize);
       if ( cfg.ColumnSortingKeys != null )
		cs.NormalizeColoring(geneMap.BodyList, cfg.ColumnSortingKeys, colClusters);
	geneMap.ClickContextMenu("Capture Coloring");

	hm.Title = "Row/Column Clusters: " + rowClusters + "/" + colClusters;

	/*
	hm.ClickContextMenu("Utilities/Sort Columns on Type");
	hm.ClickContextMenu("Utilities/Sort Rows on Type");
	*/	
}

DCMain();
