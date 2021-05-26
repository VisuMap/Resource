// Test client for graph trained with Aug2AugVars.client.js
//
var md = vv.FindPluginObject("DMScript").NewLiveModel(null, true)
var augments = vv.ReadCsv(md.ModelName + ".aug").GetNumberTable();

function ProbAug(aug, pIdx, pFct) {
	for(var row=0; row<aug.Rows; row++){
	    var R = aug.Matrix[row];
        for (var col = 0; col < aug.Columns; col++)
            R[col] *= (col == pIdx) ? pFct : 0.0;
	}	
	var nt = New.NumberTable(md.EvalAug2Var(aug.Matrix, "PhenoMap"));
	
	var vd = vv.GetObject("TstVD");
	if ( (vd == null) || vd.TheForm.IsDisposed ) {
		var bsList = vv.Dataset.BodyListEnabled();
		for(var row=0; row<nt.Rows; row++)
		    nt.RowSpecList[row].CopyFromBody(bsList[row]);
		vd = nt.ShowValueDiagram();
	       vv.SetObject("TstVD", vd);
	} else {
		vd.GetNumberTable().CopyValuesFrom(nt);
		vd.Redraw();
	}	
}

ProbAug(augments, 
	1,     // 0:20
	1.0    //0.0|0.1|0.2|0.3|0.4|0.5|0.6|0.7|0.8|0.9|1.0
);





