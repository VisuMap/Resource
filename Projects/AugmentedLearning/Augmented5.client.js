// Creates a node map by the fan-out/in vectors. 
// Biases are considered as input from their previous layer.
//
var md = vv.FindPluginObject("DMScript").NewLiveModel(null, true)
var aug = vv.ReadCsv(md.ModelName + ".aug").GetNumberTable();
function SetTypes(tb){
	var bsList = vv.Dataset.BodyListEnabled();
	if ( bsList.Count == tb.Rows ) {
		for(var row=0; row<tb.Rows; row++) {
			var rs = tb.RowSpecList[row];
			var b = bsList[row];
			rs.CopyFromBody(b);
			rs.Id = b.Id;
		}
	}

	var csList = vv.Dataset.ColumnSpecList;
	if (csList.Count == tb.Columns ) {
		for(var col=0; col<csList.Count; col++) {
			var cs = tb.ColumnSpecList[col];
			cs.CopyFrom(csList[col])
			cs.Id = csList[col].Id;
		}
	}
}


vv.Echo("Fetching data...");
var out = md.EvalAug2Var(aug.Matrix, "PhenoMap");
vv.Echo("Showing data...");

var nt = New.NumberTable(out);
var vd = vv.GetObject("AugTest");
if ( (vd == null) || vd.TheForm.IsDisposed ) {
	SetTypes(nt);
	SetTypes(aug);
	vd = nt.ShowHeatMap();
	aug.ShowHeatMap();
	vv.SetObject("AugTest", vd);
} else {
	vd.GetNumberTable().Copy(nt);
	vd.Redraw();
}



