// Creates a node map by the fan-out/in vectors. 
// Biases are considered as input from their previous layer.
//
var md = vv.FindPluginObject("DMScript").NewLiveModel(null, true)

var aug = vv.ReadCsv(md.ModelName + ".aug").GetNumberTable();
var refInput = New.NumberTable(vv.Dataset.Columns/md.LabelDimension, 3);
var m = refInput.Matrix;

function Make3DReference(m, freq) {
	var ROWS = m.Length;
	for(var row=0; row<ROWS; row++) {
		var R=m[row];
		var t = row*1.0/ROWS;
		var a = freq * t * 2 * Math.PI;
		R[0] = Math.sin(a);
		R[1] = Math.cos(a);
		R[2] = 2*t - 1.0;
	}
}

Make3DReference(m, 6.0)
md.UploadMatrix(m, false);
var out = md.EvalInAug2Var(aug.Matrix, "PhenoMap");
var nt = New.NumberTable(out);
var bsList = vv.Dataset.BodyListEnabled();
for(var row=0; row<nt.Rows; row++) {
	var b = bsList[row];
	nt.RowSpecList[row].CopyFromBody(b);
	aug.RowSpecList[row].CopyFromBody(b);
}
aug.ShowPcaView();

var vd = vv.GetObject("AugTest");
if ( (vd == null) || vd.TheForm.IsDisposed ) {
	vd = nt.ShowValueDiagram();
	vv.SetObject("AugTest", vd);
} else {
	vd.GetNumberTable().Copy(nt);
	vd.Redraw();
}
