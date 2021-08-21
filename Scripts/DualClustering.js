//DualClustering.js
//
//Cluster the rows and columns of a number table of the parent data view.
//
var cs = New.CsObject(`
	public void CopyRowTypes(IList<IRowSpec> rsList, IList<IBody> bodyList) {
		for(int i=0; i<rsList.Count; i++)
			rsList[i].Type = bodyList[i].Type;
	}
	public void CopyColumnTypes(IList<IColumnSpec> csList, IList<IBody> bodyList) {
		for(int i=0; i<csList.Count; i++)
			csList[i].Group = bodyList[i].Type;
	}
       // permut the cluster index, so that similar data have equal cluster indexes.
	public void NormalizeColoring(IList<IBody> bList, IList<IValueItem> keys, int cN) {
		if ( keys.Count != bList.Count ) {
			vv.Message("Invalid sorting keys!");
			return;
		}
		double[] cWeight = new double[cN];
		int[] cCount = new int[cN];
		for(int i=0; i<bList.Count; i++) {
              	cWeight[bList[i].Type] += keys[i].Value;
			cCount[bList[i].Type] += 1;
		}
		for(int i=0; i<cN; i++)
			if ( cCount[i] != 0 )
				cWeight[i] /= cCount[i];
		int[] idxOrder = new int[cN];
		for(int i=0; i<cN; i++) idxOrder[i] = i;
		Array.Sort(idxOrder, cWeight);
		int[] idxMap = new int[cN];
		for(int i=0; i<cN; i++)
              	idxMap[idxOrder[i]] = i;
		foreach(IBody b in bList)
              	b.Type = (short)idxMap[b.Type];		
	}
`);

function RunMdsCluster(mds, mtr, minPoints, minSize, initExa, ppRatio) {
	mds.Is3D = false;
	mds.Metric = mtr;
	mds.ClusterAlgorithm = 4;  // for HDBSCAN algorithm
	mds.AutoClustering = false;
	mds.AutoNormalizing = false;
	mds.RefreshFreq = 50;
	mds.PerplexityRatio = ppRatio;
	var frm= mds.TheForm;
	frm.HdbMinPoints = minPoints;
	frm.HdbMinClusterSize = minSize;
	frm.TsneExaFactor = initExa;
	frm.TsneExaSmoothen = true;
	frm.TsneMaxLoops = 5000;
	frm.DbsClusterNoise = true;
	mds.Reset().Start().ClusterData();
	var mpView = mds.Is3D ? mds.Show3DView() : mds.Show2DView();
	mpView.NormalizeView();
	return [mds.ClustersFound, mpView];
}

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
	mds.SetTrainingData(nt2);
	const [colClusters, colMap] = RunMdsCluster(mds, mtr.cos, 3, 50, 4.0, 0.1);
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
	pp.TheForm.SetBounds(600, 500, winWidth, winHeight);
	rowMap.TheForm.SetBounds(pp.TheForm.Left - sz + 15, pp.TheForm.Top, sz, sz);
	colMap.TheForm.SetBounds(pp.TheForm.Left, pp.TheForm.Top - sz + 8, sz, sz);

	// context menu to the row and column maps.
	var CaptureColor = 
`@
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
}

DCMain();
