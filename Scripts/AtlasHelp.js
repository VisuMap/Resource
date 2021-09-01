// AtlasHelp.js
//
// Help functions.
//

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
};

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
};

var cs = New.CsObject(`
	public void ShiftTable(INumberTable nt, double shiftFactor) {
		double[] cm = nt.ColumnMean().Select(it=>it.Value * shiftFactor).ToArray();
		for(int row=0; row<nt.Rows; row++)
			for(int col=0; col<nt.Columns; col++)
				nt.Matrix[row][col] -= cm[col];
	}

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

	public void ShowActiveGenes(IList<string> selectedItems, INumberTable expTable, IMapSnapshot snapshot) {
		if ( (selectedItems==null) || (selectedItems.Count==0) )
			return;
		INumberTable selected = expTable.SelectRowsById(selectedItems);
		if ( selected.Rows == 0 )
			return;
		var colMean = selected.ColumnMean().Select(it=>it.Value).ToArray();
		var bList = snapshot.BodyList;
		var bv = snapshot.Tag as IBarView;
		double minExpr = colMean.Min();
		double maxExpr = colMean.Max();
		double stepSize = (maxExpr - minExpr)/16;
		if ( stepSize <= 0 )
			return;
		for(int i=0; i<bList.Count; i++) {
			bList[i].Type = (short) ( 2.0*(colMean[i] - minExpr)/stepSize);
			bv.ItemList[i].Value = colMean[i];
		}
		bv.Redraw();
		snapshot.RedrawBodiesType();
	}

	public void ShowActiveCells(IList<string> selectedItems, INumberTable expTable, IMapSnapshot snapshot) {
		if ( (selectedItems==null) || (selectedItems.Count==0) )
			return;
		INumberTable selected = expTable.SelectColumnsById(selectedItems);
		if ( selected.Columns == 0 )
			return;
		var bList = snapshot.BodyList;
		var bv = snapshot.Tag as IBarView;
		var items = bv.ItemList;
		for(int row=0; row<selected.Rows; row++) {
			double sum = 0;
			double[] R = (double[])selected.Matrix[row];
			for(int col=0; col<selected.Columns; col++)
				sum += R[col];
			items[row].Value = sum/selected.Columns;
		}

		double minExpr = bv.LowerLimit;
		double maxExpr = bv.UpperLimit;
		double stepSize = (maxExpr - minExpr)/16;
		if ( stepSize <= 0 )
			return;
		for(int row=0; row<bList.Count; row++)
			bList[row].Type = (short) ( (items[row].Value - minExpr)/stepSize);

		bv.Redraw();
		snapshot.RedrawBodiesType();
	}

	public void SetRange(INumberTable expTable, IBarView bv) {
		double maxV = expTable.MaximumValue();
		double minV = expTable.MinimumValue();
		bv.UpperLimit = 20.0;
		bv.LowerLimit = 0;
	}
`);
