//
// Randimizing given clusters with increasingly larger noise.
//

var nt = vv.GetNumberTableView(true).CheckForWrite();

//var selectedItems = vv.SelectedItems;
var selectedItems = vv.Dataset.BodyIdsForType(5);  // selected all type 5 data points.
var mds = New.MdsCluster(nt).Show();
mds.MaxLoops = 2000;
mds.PerplexityRatio = 0.1;
mds.ExaggerationFactor = 4.0;
mds.RefreshFreq = 50;
mds.GlyphScale = 20;
mds.Metric = "Correlation.Cosine Distance";
//mds.Metric = "EuclideanMetric";

var cs = New.CsObject(`
   Random rg = new System.Random(123);
	public void RandRows(INumberTable nt, IList<string> rows, double noiseScale) {
		double fct = noiseScale * 2.0/Math.Sqrt(nt.Rows);
		foreach(string rowId in rows) {
			int rowIdx = vv.Dataset.IndexOfRow(rowId);
			var R = nt.Matrix[rowIdx];
			for(int k=0; k<nt.Columns; k++)
				R[k] = fct * rg.NextDouble();
		}
	}
`);

for (var noiseScale of [0.1, 1, 2.5, 5, 20]) {
	cs.RandRows(nt, selectedItems, noiseScale);
	nt.Centralize();
	mds.SetTrainingData(nt).Reset().Start();
	if (mds.LoopsTsne != mds.MaxLoops) 
		break;
	var map = mds.Show2DView();
	map.Title = "Noise: " + noiseScale;
	map.NormalizeView();
}

mds.Close();
	
