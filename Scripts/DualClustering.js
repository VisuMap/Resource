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

var nt = pp.GetNumberTable().Clone();
var mds = New.MdsCluster(nt);
mds.Show();
mds.Metric="Correlation.Cosine Distance";
mds.ClusterAlgorithm = 4;
mds.AutoClustering = false;
mds.TheForm.HdbClusterNoise = true;

[mds.TheForm.HdbMinPoints, mds.TheForm.HdbMinClusterSize ] = [5, 50];
mds.Reset().Start().ClusterData();

var rowMap = mds.Show2DView();
for(var i=0; i<mds.BodyList.Count; i++)
	nt.RowSpecList[i].Type = mds.BodyList[i].Type;
var rowClusters = mds.TheForm.ClustersFound;

mds.SetTrainingData(nt.Transpose2());
[mds.TheForm.HdbMinPoints, mds.TheForm.HdbMinClusterSize ] = [3, 30];
mds.Reset().Start().ClusterData();

for(var i=0; i<mds.BodyList.Count; i++)
	nt.ColumnSpecList[i].Group = mds.BodyList[i].Type;
var colClusters = mds.TheForm.ClustersFound;
var hm = nt.ShowHeatMap();
hm.Title = "Row/Column Clusters: " + rowClusters + "/" + colClusters;
var colMap = mds.Show2DView();
mds.Close();

var sz = 320;
hm.TheForm.SetBounds(600, 500, 800, 540);
rowMap.TheForm.SetBounds(615 - sz, 650, sz, sz);
colMap.TheForm.SetBounds(800, 508-sz, sz, sz);

