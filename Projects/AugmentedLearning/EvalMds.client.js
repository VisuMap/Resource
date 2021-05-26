// Feed the graph with augmentation and display the output data as well 
// as the augment themself.
//
var md = vv.FindPluginObject("DMScript").NewLiveModel(null, true)

var aug = vv.ReadCsv(md.ModelName + ".aug").GetNumberTable();
var out = md.EvalAug2Var(aug.Matrix, "OutputTensor");
var nt = New.NumberTable(out);

var bsList = vv.Dataset.BodyListEnabled();
if ( nt.Rows == bsList.Count ) 
  for(var row=0; row<nt.Rows; row++) {
    nt.RowSpecList[row].CopyFromBody(bsList[row]);
    aug.RowSpecList[row].CopyFromBody(bsList[row]);
  }

nt.ShowHeatMap();
aug.ShowPcaView();



