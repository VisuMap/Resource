//!import "AtlasHelp.js"
//
// DualEmbedding.js
// Create t-SNE embedding for rows and columns of heatmap.
//

ValidateHeatMap(pp);

function RunEmbedding(mds, epochs, mtr, initExa, ppRatio) {
	mds.Is3D = false;
	mds.Metric = mtr;
	mds.ClusterAlgorithm = 4;  // for HDBSCAN algorithm
	mds.AutoClustering = false;
	mds.AutoNormalizing = false;
	mds.RefreshFreq = 50;
	mds.PerplexityRatio = ppRatio;
	mds.Reset().Start();
	var mpView = mds.Is3D ? mds.Show3DView() : mds.Show2DView();
	mpView.NormalizeView();
	return mpView;
};

function DEmbeddingMain() {
	var nt = pp.GetNumberTable();
	var mds = New.MdsCluster(nt);
	mds.Show();
		
	var rowMap = RunEmbedding(mds, cfg.cEpochs, cfg.cMtr, cfg.cInitExa, cfg.cPpr);

	var nt2 = nt.Transpose2();
	cs.ShiftTable(nt2, cfg.gPrShift);
	mds.SetTrainingData(nt2);
	var colMap = RunEmbedding(mds, cfg.gEpochs, cfg.gMtr, cfg.gInitExa, cfg.gPpr);
	nt2.FreeRef();
	mds.Close();

	var sz = 450;
	var winWidth = sz;
	var winHeight = sz;
	pp.TheForm.SetBounds(1000, 700, winWidth, winHeight);
	rowMap.TheForm.SetBounds(pp.TheForm.Left - sz + 15, pp.TheForm.Top, sz, sz);
	colMap.TheForm.SetBounds(pp.TheForm.Left, pp.TheForm.Top - sz + 8, sz, sz);
	rowMap.Title = "Cell Map";
	colMap.Title = "Gene Map";
}

DEmbeddingMain();
