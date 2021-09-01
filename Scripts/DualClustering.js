//!import "AtlasHelp.js"
//DualClustering.js
//
//Cluster the rows and columns of a number table of the parent data view.
//

function DCMain() {
	var nt = pp.GetNumberTable();
	var mds = New.MdsCluster(nt);
	mds.Show();
	var mtr = {'cos':'Correlation.Cosine Distance', 'euc':'EuclideanMetric', 'cor':'Correlation.Standard Correlation'};
		
	const [rowClusters, rowMap] = RunMdsCluster(mds, mtr.cos, 3, 50, 6.0, 0.1);

       if ( typeof(RowSortingKeys) != 'undefined' )
		cs.NormalizeColoring(mds.BodyList, RowSortingKeys, rowClusters);
	cs.CopyRowTypes(nt.RowSpecList, mds.BodyList);
	pp.Redraw();

	var nt2 = nt.Transpose2();
	cs.ShiftTable(nt2, 1.0);
	mds.SetTrainingData(nt2);
	const [colClusters, colMap] = RunMdsCluster(mds, mtr.cos, 10, 100, 4.0, 0.1);
	nt2.FreeRef();

       if ( typeof(ColumnSortingKeys) != 'undefined' )
		cs.NormalizeColoring(mds.BodyList, ColumnSortingKeys, colClusters);
	cs.CopyColumnTypes(nt.ColumnSpecList, mds.BodyList);	
	pp.Redraw();
	pp.Title = "Row/Column Clusters: " + rowClusters + "/" + colClusters;

	mds.Close();
	/*
	pp.ClickContextMenu("Utilities/Sort Columns on Type");
	pp.ClickContextMenu("Utilities/Sort Rows on Type");
	*/
	
	var sz = 450;
	var winWidth = sz;
	var winHeight = sz;
	pp.TheForm.SetBounds(1000, 700, winWidth, winHeight);
	rowMap.TheForm.SetBounds(pp.TheForm.Left - sz + 15, pp.TheForm.Top, sz, sz);
	colMap.TheForm.SetBounds(pp.TheForm.Left, pp.TheForm.Top - sz + 8, sz, sz);
	rowMap.Title = "Cell Map";
	colMap.Title = "Gene Map";

	// context menu to the row and column maps.
	var CaptureColor = `@
hm = vv.EventSource.Item
nt = hm.GetNumberTable()
spList = nt.RowSpecList if (pp.Tag == 0) else nt.ColumnSpecList
for i, b in enumerate(pp.BodyList):
	spList[i].Type = b.Type
hm.Redraw()`;

	[rowMap.Tag, colMap.Tag] = [0, 1];
	for( var mp of [rowMap, colMap] ) 
		mp.AddContextMenu("Captur Coloring", CaptureColor,  pp, 
			"C:\\Program Files\\VisuMap Technologies\\VisuMap5\\resource\\icon\\PartitionA.png", 
			"Push the cluster coloring to the heatmap");

	colMap.AddContextMenu("Show Gene Activity", "C:\\Users\\James\\OneDrive\\Desktop\\ShowActiveGenes.js");
}


DCMain();
