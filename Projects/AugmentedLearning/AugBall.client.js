// Creates a node map by the fan-out/in vectors. 
// Biases are considered as input from their previous layer.
//

/*
function GetOutputY(){
	var bsList = vv.Dataset.BodyListEnabled();
	var nt = New.NumberTable(bsList.Count, 3).Matrix;
	for(var row=0; row<bsList.Count; row++) {
		nt[row][0] = bsList[row].X;
		nt[row][1] = bsList[row].Y;
		nt[row][2] = bsList[row].Z;
	}
	return nt;
}
var nt = GetOutputY();
*/

var cs = New.CsObject("\
	public void SetBodyList(IList<IBody> bs, double[][] matrix, double f){\
		bool is3D = (matrix[0].Length == 3); \
		for(int row=0; row<matrix.Length; row++) {\
		    bs[row].X = f*matrix[row][0];\
		    bs[row].Y = f*matrix[row][1];\
		    bs[row].Z = is3D ? f*matrix[row][2] : 0;\
		}\
	}\
");

var md = vv.FindPluginObject("DMScript").NewLiveModel(null, true, 7777)
var K = 50;
var aug = vv.ReadCsv(md.ModelName + ".aug").GetNumberTable();
var X = vv.GetNumberTable().Clone();


md.UploadMatrix(X.Matrix, true);
vv.GuiManager.RememberCurrentMap();

var Rx = New.NumberArray(aug.Columns);
var factor = 0.75/0.0009859155;
var targetVar = "PhenoMap";
//targetVar = "AugmentOut"; factor *= 5.025;
var augInfo = eval("(" + md.ReadString("ModelInfo") + ")");
var augVar1 = augInfo.AugVar1;
var augVar2 = augInfo.AugVar2;
var varDim1 = augInfo.Var1Dim;
var varDim2 = augInfo.Var2Dim;
var Rx1 = New.NumberArray(varDim1);
var Rx2 = New.NumberArray(varDim2);


aug.ShowPcaView();
var map = vv.GetObject("Augmented2Map");
if ( (map == null) || map.TheForm.IsDisposed ) {
	map = New.Map3DView();
	map.Show();
	vv.SetObject("Augmented2Map", map);
}

for(var row=1; row<aug.Rows; row++) {
	vv.SelectedItems = New.StringArray(aug.RowSpecList[row].Id);
	map.Title = "Set: " + row;
	var R0 = aug.Matrix[row-1];
	var R1 = aug.Matrix[row];
	for(var k=0; k<K; k++) {
		var f = k*1.0/K;
		var g = 1.0 - f;
		for(var col=0; col<aug.Columns; col++)
			Rx[col] = g*R0[col] + f*R1[col];

		if (varDim2 == 0) {
			md.WriteVariable(augVar1, Rx);
		} else {
			for(var i=0; i<varDim1; i++) Rx1[i] = Rx[i];
			for(var i=0; i<varDim2; i++) Rx2[i] = Rx[varDim1 + i];
			md.WriteVariable(augVar1, Rx1);
			md.WriteVariable(augVar2, Rx2);
		}
		var ret = md.EvalVariable(null, targetVar, false);
		cs.SetBodyList(map.BodyList, ret, factor);
		map.Redraw();
		vv.Sleep(10);
	}
	// vv.Sleep(1000);
}
