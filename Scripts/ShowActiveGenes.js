//!import "AtlasHelp.js"
// ShowActiveGenes.js
// 
// Highlight active genes for selected cells.
//
var expTable = pp.GetNumberTable();
var geneMap = vv.FindWindow("Gene Map");
var sp = geneMap.NewSnapshot();

sp.GlyphSet="Ordered Glyphs";
sp.Top = pp.Top;
sp.Left = pp.Left + pp.TheForm.ClientSize.Width;
sp.Width = geneMap.Width;
sp.Height = geneMap.Height;
sp.Title = "Active Genes";
sp.ShowMarker(false);

var bv = New.BarView(expTable);
var dLeft = 24;
bv.Show();
bv.Top = pp.Top + pp.Height - 8;
bv.Left = pp.Left + dLeft;
bv.Width = pp.Width - dLeft;
bv.Height = sp.Height/2;
bv.AutoScaling = true;
sp.Tag = bv;
vv.FindWindow("Cell Map").ShowMarker(true);

vv.EventManager.OnItemsSelected("!cs.ShowActiveGenes(vv.EventSource.Item, expTable, sp);", sp);