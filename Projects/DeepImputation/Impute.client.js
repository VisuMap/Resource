// Client to test data imputation models.
// 
var md = vv.FindPluginObject("DMScript").NewLiveModel();
var info = eval("(" + md.ReadString("ModelInfo") + ")");

var mis = vv.ReadCsv(md.ModelName + ".mis").GetNumberTable();
var aug = null;
//var aug = vv.ReadCsv(md.ModelName + ".aug").GetNumberTable();

if (info.Algorithm=="AugmentedImputation") {
	md.SetInput("ImputeHolder");
	var pred = md.EvalVariable(mis.Matrix, "ImputeOutput", false);
} else {
	var pred = md.Eval(mis.Matrix, false);
}

var nt = New.NumberTable(pred);
var bs = vv.Dataset.BodyListEnabled();
if (nt.Rows == bs.Count) {
	for(var row=0; row<nt.Rows; row++) {
		nt.RowSpecList[row].CopyFromBody(bs[row]);
		mis.RowSpecList[row].CopyFromBody(bs[row]);
		if (aug != null) aug.RowSpecList[row].CopyFromBody(bs[row]);
	}
}

var nt0 = vv.GetNumberTable();
md.ScaleInput(nt0.Matrix);
var ntDiff = nt0.Sub(nt);
var diff = 0.0;
var _ = vv.Math;
for(var row=0; row<nt.Rows; row++)
  diff += _.Sum(_.Abs(ntDiff.Matrix[row]))


//nt0.ShowValueDiagram().Title = "Original Data";
//mis.ShowValueDiagram().Title = "Data with missing values";
nt.ShowValueDiagram().Title = "Imputed Data, L1 distance: " + diff;
//ntDiff.ShowValueDiagram().Title = "The Difference";
if (aug != null) New.HeatMap(aug).Show();


