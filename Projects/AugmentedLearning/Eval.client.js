// Creates a node map by the fan-out/in vectors. 
// Biases are considered as input from their previous layer.
// 
var md = vv.FindPluginObject("DMScript").NewLiveModel();
var input = vv.GetNumberTable();
vv.GuiManager.RememberCurrentMap();

vv.Echo( md.ReadString("ModelInfo") );

md.Eval(input.Matrix, true, vv.Dataset.BodyList);

//md.UploadMatrix(input.Matrix, true)
//md.Eval(null, true, vv.Dataset.BodyList);

vv.Map.Redraw();
