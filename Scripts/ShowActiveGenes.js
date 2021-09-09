//!import "AtlasHelp.js"
//
// ShowActiveGenes.js
// Highlight active genes for selected cells.
//

ValidateHeatMap(pp);

function ShowActiveGenes() {
	var expTable = pp.GetNumberTable();
	var geneMap = vv.FindWindow("Gene Map");
	var cellMap = vv.FindWindow("Cell Map");
	
	if ( (cellMap==null) || (geneMap==null) ) {
		vv.Message("Cell/Gene map not present!\nPlease run DualClustering!");
		vv.Return();
	}
	
	cellMap.ShowMarker(true);
	geneMap.ShowMarker(false);
	
	var sp = NewExpressionMap(geneMap, "Active Genes");
	sp.Top = pp.Top;
	sp.Left = pp.Left + pp.TheForm.ClientSize.Width;
	
	var bv = New.BarView(expTable.SelectRows(New.IntArray(0)));
	bv.Show();
	bv.Top = pp.Top + pp.Height - 8;
	bv.Left = pp.Left + 24;
	bv.Width = pp.Width - 24;
	bv.Height = sp.Height/2;
	bv.AutoScaling = true;
	bv.Horizontal = false;
	bv.Title = "Cell Expression Profile";
	sp.Tag = bv;
	bv.Redraw();
	
	pp.SelectionMode = 0;
	vv.EventManager.OnItemsSelected("!cs.ShowActiveGenes(vv.EventSource.Item, expTable, sp);", sp);
}

ShowActiveGenes();
