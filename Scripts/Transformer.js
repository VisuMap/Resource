//File: Transformer.js
var mapList = vv.Dataset.MapNameList;
var Nm0 = vv.Map.Name;
var map = New.MapSnapshot().Show();
map.ZoomingFactor = 0.85;
var moved = 0;
vv.Sleep(8000);
for (var nm in vv.Dataset.MapNameList) {
    if ( map.TheForm.IsDisposed )
        break;
    if ( (nm == Nm0) || (nm[0] != Nm0[0]) )
        continue;
    map.Title = "-> " + nm;
    var bsList = vv.Dataset.ReadMapBodyList(nm);
    moved += map.MoveBodiesTo(bsList, 30, 40, 0);
}
map.Title = "Total moved: " + moved;
