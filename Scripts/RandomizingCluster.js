//
// Randimizing given clusters with increasingly larger noise.
//

function NewMds() {
	var mds = New.MdsCluster(nt).Show();
	mds.MaxLoops = 2000;
	mds.PerplexityRatio = 0.1;
	mds.ExaggerationFactor = 4.0;
	mds.RefreshFreq = 50;
	mds.GlyphScale = 20;
	//mds.Metric = "Correlation.Cosine Distance";
	mds.Metric = "EuclideanMetric";
	return mds;
}

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
	public IList<string> GetZeroRows(INumberTable nt) {
		List<string> idList = new List<string>();
		double[][] M = (double[][])nt.Matrix;
		var rsList = nt.RowSpecList;
		for(int row=0; row<nt.Rows; row++)
			if ( M[row].All(v=>v==0) )
				idList.Add(rsList[row].Id);
		return idList;
	}
`);

var nt = vv.GetNumberTableView(true).CheckForWrite();
var selectedItems = cs.GetZeroRows(nt);
//selectedItems.AddRange( vv.Dataset.BodyIdsForType(12) )
//var selectedItems = vv.SelectedItems;
//var selectedItems = vv.Dataset.BodyIdsForType(5);  // selected all type 5 data points.


var ncList = [0,  1, 5, 10, 20];
//var ncList = [0, 0.05, 0.1, 0.2, 0.5, 1, 5];
//var ncList = [0.001, 0.005, 0.01, 0.05];

var mds = NewMds();

for (var noiseScale of ncList) {
	cs.RandRows(nt, selectedItems, noiseScale);
	//nt.Centralize();
	mds.SetTrainingData(nt).Reset().Start();
	if (mds.LoopsTsne != mds.MaxLoops) 
		break;
	var map = mds.Show2DView();
	map.Title = "Noise: " + noiseScale;
	map.NormalizeView();
}

mds.Close();
	
