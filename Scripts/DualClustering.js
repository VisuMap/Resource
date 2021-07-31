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
		for(int i=0; i<bList.Count; i++)
                  cWeight[bList[i].Type] += keys[i].Value;
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



function DCMain() {
	var nt = pp.GetNumberTable();
	var mds = New.MdsCluster(nt);
	mds.Show();
	mds.Is3D = false;
	mds.Metric="Correlation.Cosine Distance";
	//mds.ClusterAlgorithm = 3;  // for DBSCAN algorithm
	mds.ClusterAlgorithm = 4;  // for HDBSCAN algorithm
	mds.AutoClustering = false;
	mds.AutoNormalizing = false;
	var frm = mds.TheForm;
	frm.TsneExaSmoothen = true;
	frm.TsneMaxLoops = 5000;
	frm.HdbClusterNoise = true;
	frm.DbsClusterNoise = true;
		
	[frm.HdbMinPoints, frm.HdbMinClusterSize, frm.TsneExaFactor, mds.PerplexityRatio ] = [4, 100, 6.0, 0.05];
	//[frm.DbsMinPoints, frm.DbsEpsilonRatio, frm.TsneExaFactor, mds.PerplexityRatio ] = [25, 1.0, 6.0, 0.05];
	mds.Reset().Start().ClusterData();

	var rowClusters = mds.ClustersFound;
       if ( typeof(RowSortingKeys) != 'undefined' )
		cs.NormalizeColoring(mds.BodyList, RowSortingKeys, rowClusters);
	var rowMap = mds.Is3D ? mds.Show3DView() : mds.Show2DView();
	rowMap.NormalizeView();
	cs.CopyRowTypes(nt.RowSpecList, mds.BodyList);
	pp.Redraw();

	mds.SetTrainingData(nt.Transpose2());
	[frm.HdbMinPoints, frm.HdbMinClusterSize, frm.TsneExaFactor, mds.PerplexityRatio ] = [4, 100, 4.0, 0.05];
	//[frm.DbsMinPoints, frm.DbsEpsilonRatio, frm.TsneExaFactor, mds.PerplexityRatio ] = [25, 1.0, 6.0, 0.05];
	mds.Reset().Start().ClusterData();

	var colClusters = mds.ClustersFound;
       if ( typeof(ColumnSortingKeys) != 'undefined' )
		cs.NormalizeColoring(mds.BodyList, ColumnSortingKeys, colClusters);
	var colMap = mds.Is3D ? mds.Show3DView() : mds.Show2DView();
	colMap.NormalizeView();
	cs.CopyColumnTypes(nt.ColumnSpecList, mds.BodyList);	
	pp.Redraw();
	pp.Title = "Row/Column Clusters: " + rowClusters + "/" + colClusters;
	mds.Close();
	
	var sz = 420;
	var winWidth = 840;
	var winHeight = 640;
	pp.TheForm.SetBounds(600, 500, winWidth, winHeight);
	rowMap.TheForm.SetBounds(pp.TheForm.Left - sz + 15, pp.TheForm.Top, sz, sz);
	colMap.TheForm.SetBounds(pp.TheForm.Left, pp.TheForm.Top - sz + 8, sz, sz);
}

DCMain();
