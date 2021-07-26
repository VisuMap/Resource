//DualClustering.js
//
//Description: Cluster the rows and columns of a number table of the 
//parent data view.
//
//======================================================================
var nt = pp.GetNumberTable().Clone();
var mds = New.MdsCluster(nt);
mds.Show();
mds.Metric="Correlation.Cosine Distance";
mds.ClusterAlgorithm = 4;
mds.AutoClustering = false;
mds.TheForm.HdClusterNoise = true;

[mds.TheForm.MinPoints, mds.TheForm.MinClusterSize ] = [5, 50];
mds.Reset().Start().ClusterData();

//mds.Show2DView();
for(var i=0; i<mds.BodyList.Count; i++)
	nt.RowSpecList[i].Type = mds.BodyList[i].Type;
var rowClusters = mds.TheForm.ClustersFound;

mds.SetTrainingData(nt.Transpose2());
[mds.TheForm.MinPoints, mds.TheForm.MinClusterSize ] = [3, 30];
mds.Reset().Start().ClusterData();

for(var i=0; i<mds.BodyList.Count; i++)
	nt.ColumnSpecList[i].Group = mds.BodyList[i].Type;
var colClusters = mds.TheForm.ClustersFound;
var hm = nt.ShowHeatMap();
hm.Title = "Row/Column Clusters: " + rowClusters + "/" + colClusters;
mds.Close();


