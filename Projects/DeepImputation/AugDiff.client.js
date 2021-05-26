// Client to test AugDiff models.
// 
var md = vv.FindPluginObject("DMScript").NewLiveModel();
var info = eval("(" + md.ReadString("ModelInfo") + ")");

var aug = vv.ReadCsv(md.ModelName + ".aug").GetNumberTable();
var mis = vv.ReadCsv(md.ModelName + ".mis").GetNumberTable();
md.SetInput("AugmentHolder");
var predMatrix = md.Eval(aug.Matrix, false);

var pred = New.NumberTable(predMatrix);
var bs = vv.Dataset.BodyListEnabled();
if (pred.Rows == bs.Count) {
	for(var row=0; row<pred.Rows; row++) {
		pred.RowSpecList[row].CopyFromBody(bs[row]);
		mis.RowSpecList[row].CopyFromBody(bs[row]);
		aug.RowSpecList[row].CopyFromBody(bs[row]);
	}
}

var nt0 = vv.GetNumberTable();
md.ScaleInput(nt0.Matrix);
var ntDiff = nt0.Sub(pred);
var diff = 0.0;
var _ = vv.Math;
for(var row=0; row<pred.Rows; row++)
  diff += _.Sum(_.Abs(ntDiff.Matrix[row]))


//nt0.ShowValueDiagram().Title = "Original Data";
//mis.ShowValueDiagram().Title = "Data with missing values";
pred.ShowValueDiagram().Title = "Imputed Data, L1 distance: " + diff;
//ntDiff.ShowValueDiagram().Title = "The Difference";
New.PcaView(aug).Show();


