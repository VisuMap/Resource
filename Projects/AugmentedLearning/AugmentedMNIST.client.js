// Creates a node map by the fan-out/in vectors. 
// Biases are considered as input from their previous layer.
//
var md = vv.FindPluginObject("DMScript").NewLiveModel(null, true)

vv.SetObject("AugTestData", null); 
vv.SetObject("AugTest", null);

var dt = vv.GetObject("AugTestData");
if (dt == null) {
	dt = vv.ReadCsv(md.ModelName + ".aug").GetNumberTable();
	vv.SetObject("AugTestData", dt);
}
var aug = dt;

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

var inTable = vv.Dataset.GetNumberTableEnabled();
var refData = inTable.SelectRows(New.IntArray(0));
refData = refData.Reshape(28, 28);
for(var k=0; k<28; k++) {
	refData.Matrix[k][k] = 0.5;
	refData.Matrix[k][27-k] = 0.5;
}
md.UploadMatrix(refData.Matrix)
var out = md.EvalInAug2Var(aug.Matrix, "PhenoMap")
var outTable = New.NumberTable(out);
for(var row=0; row<outTable.Rows; row++) {
    outTable.RowSpecList[row].CopyFrom(inTable.RowSpecList[row]);
    outTable.RowSpecList[row].Id = inTable.RowSpecList[row].Id;
}

vv.Echo("Showing data...");

var vd = vv.GetObject("AugTest");
if ( (vd == null) || vd.TheForm.IsDisposed) {
	vd = outTable.ShowHeatMap();
	aug.ShowHeatMap();
	vv.SetObject("AugTest", vd);
} else {
	vd.GetNumberTable().Copy(outTable);
	vd.Redraw();
}
