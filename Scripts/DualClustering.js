//DualClustering.js
//
//Cluster the rows and columns of a number table of the 
//parent data view.
//
/*
To install this script, select and run the following line:

vv.GuiManager.SetCustomMenu('Dual Clustering', True, vv.CurrentScriptPath, 'HeatMap')

To remove this context menu, select and run the following line:

vv.GuiManager.RemoveCustomMenu('Dual Clustering')
*/

// permut the cluster index, so that similar data have equal cluster indexes.
function NormalizeColoring(bList, keys, cN) {
  if ( keys == null ) {
    vv.Echo("No sorting keys present");
    return;
  }
  let cWeight = Array(cN).fill(0);
  let cCount = Array(cN).fill(0);
  for(let i=0; i<bList.Count; i++) {
	let idx = bList[i].Type;
	cWeight[idx] += keys[i].Value;
	cCount[idx] += 1;
  }
  for(let i=0; i<cN; i++)
	if ( cCount[i] > 0 )
		cWeight[i] /= cCount[i];
  let idxOrder = Array(cN).fill(0).map((_, i)=>i);
  idxOrder.sort((i,j)=>cWeight[j]-cWeight[i])
  let idxMap = Array(N).fill(0);
  for(let i=0; i<cN; i++) 
	idxMap[idxOrder[i]] = i;
  for(let i=0; i<bList.Count; i++)
	bList[i].Type = idxMap[bList[i].Type];
}

var nt = pp.GetNumberTable().Clone();
var mds = New.MdsCluster(nt);
mds.Show();
mds.Is3D = true;
mds.Metric="Correlation.Cosine Distance";
mds.ClusterAlgorithm = 4;
mds.AutoClustering = false;
mds.AutoNormalizing = false;
var frm = mds.TheForm;
frm.TsneExaFactor = 12;
frm.TsneExaSmoothen = true;
frm.TsneMaxLoops = 5000;
frm.HdbClusterNoise = true;


[frm.HdbMinPoints, frm.HdbMinClusterSize ] = [5, 50];
mds.Reset().Start().ClusterData();
var rowClusters = frm.ClustersFound;
NormalizeColoring(mds.BodyList, vv.GetObject("RowKeys"), rowClusters);

var rowMap = mds.Is3D ? mds.Show3DView() : mds.Show2DView();
for(var i=0; i<mds.BodyList.Count; i++)
	nt.RowSpecList[i].Type = mds.BodyList[i].Type;

mds.SetTrainingData(nt.Transpose2());
[frm.HdbMinPoints, frm.HdbMinClusterSize ] = [3, 30];
mds.Reset().Start().ClusterData();
var colClusters = frm.ClustersFound;
NormalizeColoring(mds.BodyList, vv.GetObject("ColKeys"), colClusters);

for(var i=0; i<mds.BodyList.Count; i++)
	nt.ColumnSpecList[i].Group = mds.BodyList[i].Type;
var hm = nt.ShowHeatMap();
hm.Title = "Row/Column Clusters: " + rowClusters + "/" + colClusters;
var colMap = mds.Is3D ? mds.Show3DView() : mds.Show2DView();
mds.Close();

var sz = 320;
rowMap.NormalizeView();
colMap.NormalizeView();
hm.TheForm.SetBounds(600, 500, 800, 540);
rowMap.TheForm.SetBounds(615 - sz, 650, sz, sz);
colMap.TheForm.SetBounds(800, 508-sz, sz, sz);
