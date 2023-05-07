//TrainDatasets.js
vv.Import("AtlasHelp.js");

cfg.refGenes = null;
cfg.maxRows = 0;

function BroadcastColumnOrder() {
	vv.EventManager.RaiseItemsReordered(pp.GetNumberTable().ColumnSpecList.ToIdList())
}

var cs = New.CsObject(`
	public void NormalizeRows(INumberTable nt) {
		double[][] M = nt.Matrix as double[][];
		MT.Loop(0, nt.Rows, row=>{
			double[] R = M[row];
			double sum = R.Sum();
			if ( sum == 0 ) 
				sum = 0.01;
			for(int col=0; col<nt.Columns; col++)
				R[col] /= sum;
		});
	}

	public int GetSignature(INumberTable nt) {
		double[][] M = nt.Matrix as double[][];
		int w = 0;
		for(int row=0; row<nt.Rows; row++)
		for(int col=0; col<nt.Columns; col++)
			if (M[row][col] != 0)
				w += col;
		return w;
	}
`);

function ShowFeatureOrder(itemList) {
	var id2Idx = New.Hashtable();
	var columns = 32060;
	var nt = New.NumberTable(itemList.length, columns)	
	for(var k = 0; k<itemList.length; k++) {
		var item = pp.FindItemById(itemList[k]);
		var fs = item.Tag.split('|');
		var ps = fs[0].split('&');
		var i0 = ps[1] - 0 + 1 
		if ( k == 0 ) {
			var csList = nt.ColumnSpecList;
			for(var i=i0; i<fs.length; i++) {
				id2Idx.Add(fs[i], i-i0);
				csList[i-i0].Id = fs[i];
			}
		}
		var R = nt.Matrix[k];
		for(var i=i0; i<fs.length; i++) {
			var col = id2Idx(fs[i]);
			R[col] = i-i0;
		}
		nt.RowSpecList[k].Id = item.Name;
	}
	nt.ShowHeatMap();
}

function ShowBiHeatmap() {
	var tbItem = vv.EventSource.Item;
	var vs = New.StringSplit(tbItem.Tag);
	var fs = New.StringSplit(vs[0], '&');
	var [ds1, ds2, rows] = [fs[0], fs[1], fs[2]-0]
	var columns = vs.Count-1-rows;
	var rowIds = vs.GetRange(1,rows)
	var colIds = vs.GetRange(1+rows, columns)

	var nt1 = vv.Folder.ReadDataset(ds1).GetNumberTableView();
	var nt2 = vv.Folder.ReadDataset(ds2).GetNumberTableView();
	nt1 = nt1.SelectColumnsById2(colIds, 0);
	nt2 = nt2.SelectColumnsById2(colIds, 0);
   var rows1 = nt1.Rows;
	var nt = nt1.Append(nt2);
	for(var row=0; row<nt.Rows; row++)
		nt.RowSpecList[row].Type = (row<rows1) ? 0 : 1;
	for(var cs of nt.ColumnSpecList)
		cs.Group = 0;
	
	nt = nt.SelectRowsById2(rowIds);
	var hm = nt.ShowHeatMap();
	hm.Description = ds1 + "|" + ds2;
}

function SaveBiHeatmap(dsList) {
	var nt = pp.GetNumberTable();
	var info = [dsList[0]+'&'+dsList[1]+'&'+nt.Rows];	
	for(var rs of nt.RowSpecList) 
		info.push(rs.Id);
	for(var cs of nt.ColumnSpecList) 
		info.push(cs.Id);
	var at = OpenAtlas();

	var ii = at.NewRectItem();	
	ii.Tag = info.join('|');
	ii.Top = 60*(++cfg.seq % 15);
	ii.Left = 25;
	ii.FillColor = New.Color('Yellow');
	ii.Filled = true;
	ii.IsEllipse = false;
	ii.Opacity = 0.75;
	ii.LabelStyle = 2;
	ii.IconHeight = 50; 
	ii.IconWidth = 40;
	ii.Script = `!ShowBiHeatmap()`;
	ii.Name = dsList[0]+'|'+dsList[1]
	at.RedrawItem(ii);
}

function SelectedItems() {
	var idList = [];
   for(var item of pp.GetSelectedItems())
		if (item.ItemType == "RectItem" )
			idList.push(item.Id);
	return idList;
}

function SelectedDs() {
	var idList = [];
   for(var item of pp.GetSelectedItems())
		if (item.ItemType == "RectItem" ) { 
			var s = item.Tag;
			idList.push(s.substr(0,s.indexOf('&')));
		}
	return idList;
}

function Compare2Datasets(dsList) {
	var hm = MergeDatasets(dsList);
	hm.ClickMenu("Atlas/Dual Sorting");
	hm.ClickMenu("Utilities/Sort Rows on Type");
   return hm;
}

function MergeDatasets(dsList) {
	if ( dsList.length != 2 ) {
		vv.Message("The dataset list must have only two datasets");
		return;
	}
	var nt1 = vv.Folder.ReadDataset(dsList[0]).GetNumberTable();
	var nt2 = vv.Folder.ReadDataset(dsList[1]).GetNumberTable();

	if ( cfg.maxRows != 0 ) {
		var rowList = New.Range(cfg.maxRows);
		nt1 = nt1.SelectRowsView(rowList);
		nt2 = nt2.SelectRowsView(rowList);
	}

	if ( cfg.refGenes != null ) {
		nt1 = nt1.SelectColumnsById2(cfg.refGenes, 0);
		nt2 = nt2.SelectColumnsById2(cfg.refGenes, 0);
	} else {
		var colIds = nt1.ColumnSpecList.ToIdList();
		nt2 = nt2.SelectColumnsById2(colIds, 0);
	}

   var rows1 = nt1.Rows;
	var nt = nt1.Append(nt2);
	for(var row=0; row<nt.Rows; row++)
		nt.RowSpecList[row].Type = (row<rows1) ? 0 : 1;
	for(var cs of nt.ColumnSpecList)
		cs.Group = 0;
	var hm = nt.ShowHeatMap();
	hm.Description = dsList.join('|');
	return hm;
}

function ConcatDatasets(dsList) {
	var nt = New.NumberTable(0,0);
	for(var n=0; n<dsList.length; n++) {
		var t = vv.Folder.ReadDataset(dsList[n]);
		vv.Echo("Dataset: " + dsList[n] + ": " + t.Rows + ", " + t.Columns);
		t = t.GetNumberTableView();
		t = t.SelectRowsView(New.Range(cfg.maxRows));
		if (n == 0) {
			if (cfg.refGenes == null) {
				var colIds = t.ColumnSpecList.ToIdList();
			} else {
				var colIds = cfg.refGenes;
				t = t.SelectColumnsById2(colIds, 0.0);		
			}
		} else
			t = t.SelectColumnsById2(colIds, 0.0);
		for(var rs of t.RowSpecList) 
			rs.Type = n;
		nt.Append(t);
	}
	var hm = nt.ShowHeatMap();
	hm.Title = "Datasets: " + dsList.join();
	return hm;
}

function NormalizeHeatmap(hm) {
	var nt = hm.GetNumberTable();
	nt.CheckForWrite();
	cs.NormalizeRows(nt);
	hm.Redraw();
}

//===========================================================

var dsList = '10H,12H,14H,15H,16hpf_v1,19H,24H,2D,3D,5D,10D';
dsList = dsList.split(',').slice(cfg.seq = 0)
TrainDatasets(dsList,  false);

//===========================================================

/*

for(var ds of vv.Folder.DatasetNameList) {
	vv.Folder.OpenDataset(ds);
	//vv.Echo(ds + ": " + cs.GetSignature(pp.GetNumberTable()));
	vv.Folder.DataChanged = true;
	vv.Folder.Save();
}


cfg.maxRows = 3800;
var dsList = '10H,12H,14H,15H,16hpf_v1,19H,24H,2D,3D,5D,10D';
dsList = dsList.split(',')
ConcatDatasets(dsList, 4000);

var dsList = '10H,12H,14H,15H,16hpf_v1,19H,24H,2D,3D,5D,10D';
dsList = dsList.split(',').slice(cfg.seq = 0)
TrainDatasets(dsList,  false);

ConcatDatasets(dsList, 2000);

var hmList = [22,  27, 30, 32, 35, 37, 39, 40, 41, 42, 43];
hmList = hmList.map(i=>'i'+i);
ShowFeatureOrder( hmList );

ShowFeatureOrder( SelectedItems() );

BroadcastColumnOrder();

cfg.maxRows = 5000;
Compare2Datasets(SelectedDs());

MergeDatasets(SelectedDs(), null)

SaveBiHeatmap(dsList);

cfg.refGenes = pp.AllItems;

cfg.refGenes = null;

*/

