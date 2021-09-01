//!import "AtlasHelp.js"
// ShowActiveGenes.js
// 
// Highlight active genes for selected cells.
//
var expTable = pp.GetNumberTable();
var geneMap = vv.FindWindow("Gene Map");
var cellMap = vv.FindWindow("Cell Map");

if ( (cellMap==null) || (geneMap==null) ) {
	vv.Message("Cell/Gene map not present!\nPlease run DualClustering!");
	vv.Return();
}
vv.SelectedItems = null;
var sp = geneMap.NewSnapshot();

sp.GlyphSet="Ordered Glyphs";
sp.Top = pp.Top;
sp.Left = pp.Left + pp.TheForm.ClientSize.Width;
sp.Width = geneMap.Width;
sp.Height = geneMap.Height;
sp.Title = "Active Genes";
sp.ShowMarker(false);
cellMap.ShowMarker(true);
geneMap.ShowMarker(false);

var bv = New.BarView(expTable.SelectRows(New.IntArray(0)));
var dLeft = 24;
bv.Show();
bv.Top = pp.Top + pp.Height - 8;
bv.Left = pp.Left + dLeft;
bv.Width = pp.Width - dLeft;
bv.Height = sp.Height/2;
bv.AutoScaling = true;
bv.Horizontal = false;
bv.Title = "Cell Expression Profile";
sp.Tag = bv;
bv.Redraw();

pp.SelectionMode = 0;
vv.EventManager.OnItemsSelected("!cs.ShowActiveGenes(vv.EventSource.Item, expTable, sp);", sp);