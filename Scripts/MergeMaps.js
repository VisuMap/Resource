// MergeMaps.js
//
// Caputure tSNE maps at different exaggeration levels ( i.e. scale ) and
// then merging them into a single tSNE maps.
//
var maxLoops = 1000;
var markerList = [400, 800, 850, 900, 950, maxLoops];
var mapIs3D = false;
var showMaps = true;
var mapDim = mapIs3D ? 3 : 2;

var cs = New.CsObject(`
	public void CaptureOneMap(INumberTable nt, List<IBody> bsList, int column0, bool mapIs3D) {
		double[][] M = nt.Matrix as double[][];
   	for(int k=0; k<bsList.Count; k++) {
			IBody b = bsList[k];
			double[] R = M[k];
			R[column0+0] = b.X;
			R[column0+1] = b.Y;
			if ( mapIs3D )
				R[column0+2] = b.Z;
		}
   }
`);


function BodyMoved() {
	 var idx = markerList.indexOf(mds.CurrentLoops);
    if ( idx >= 0 ) {
       cs.CaptureOneMap(nt, bsList, idx*mapDim, mapIs3D);
		 if ( showMaps )
			New.MapSnapshot().Show();
    }
}

var bsList = vv.Dataset.BodyListEnabled();
var nt = New.NumberTable(bsList, mapDim*markerList.length);
var mds = New.TsneMap();
mds.Show();
vv.EventManager.OnBodyMoved(BodyMoved.toString(), mds, null);

mds.MaxLoops = maxLoops;
mds.RefreshFreq = 10;
mds.Is3D = mapIs3D;
mds.InitialExaggeration = 3.0;
mds.FinalExaggeration = 1.1;
mds.AutoNormalizing = false;
mds.AutoScaling = true;
mds.TracingType = 6;
mds.PerplexityRatio = 0.02;
mds.Reset().Start().Close();

if ( showMaps )
  New.Atlas().Show().CaptureAllOpenViews().Close();

var md2 = New.MdsCluster(nt);
md2.Metric = "EuclideanMetric";
md2.MaxLoops = 1000;
md2.InitialExaggeration = 4.0;
md2.FinalExaggeration = 1.0;
md2.PerplexityRatio = 0.05;
md2.MdsAlgorithm=2;
md2.AutoNormalizing= true;
md2.RefreshFreq = 10;
md2.Is3D = mapIs3D;
md2.Show();
md2.Reset();
md2.Start();
md2.CaptureMap();
md2.Close();



