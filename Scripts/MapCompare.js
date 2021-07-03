//File: MapCompare.js
//
// Comparing series of 2D/3D maps by animating a map between them.
//
// Usage: Create multiple maps with similar settings and shared name prefix.
// Then, activate one map in the main window and run this script.
//
function Animation(mp, bodyList) {
    HighlightBodies(mp, bodyList);
    var moved = mp.MoveBodiesTo(bodyList, 30, 75, 0);
    vv.Sleep(1000);
    return moved;
}

function HighlightBodies(map, bodyList) {
   return;
   var selected = New.StringArray();
   var threshold = 0.5*(map.Width + map.Height)*0.05;
   threshold *= threshold;
   for(var i=0; i<map.BodyList.Count; i++) {
       var b1 = map.BodyList[i];
       var b2 = bodyList[i];
       var dx = b1.X - b2.X;
       var dy = b1.Y - b2.Y;
       var d2 = dx*dx + dy*dy;
       if ( d2 > threshold )
		selected.Add(b1.Id);
   }
   for(var k=0; k<3; k++) {
   	map.SelectedItems = selected;
	vv.Sleep(300);
	map.SelectedItems = null;
	vv.Sleep(300);
   }
   map.SelectedItems = selected; 
}

function MoveFormTo(g, f) {
   g.BringToFront();
   var newTop = f.Top - Math.floor((g.Height - f.Height) / 2);
   g.SetBounds(f.Left + f.Width - 10, newTop, 0, 0, 3);
}

var msg = "Moved bodies: ";
if ((pp.Name == "MapSnapshot") || (pp.Name == "MdsCluster")) {
    // Morphing between calling view and other open map snapshots.
    var initBody = New.BodyListClone(pp.BodyList);
    var vwList = New.ObjectArray();
    var f = pp.TheForm;
    var bsCount = pp.BodyList.Count;
    for (var vw in vv.FindFormList("MapSnapshot"))
        if ((vw.TheForm !== f) && (vw.BodyList.Count == bsCount))
            vwList.Add(vw);
    for (var vw in vwList) { 
	 MoveFormTo(vw.TheForm, f);
        msg += Animation(pp, vw.BodyList) + ", ";
    }
    msg += Animation(pp, initBody);
    pp.Title = msg;
} else {
    var initBody = New.BodyListClone(vv.Map.BodyList);
    var mpName = vv.Map.Name;
    var mpList = New.StringArray();
    var prefix = mpName.Substring(0, 1);
    for (var n in vv.Dataset.MapNameList)
        if (n.StartsWith(prefix) && (n != mpName))
            mpList.Add(n);
    var fromName = mpName;
    for (var n in mpList) {
        vv.Title = fromName + "<->" + n;
        msg += Animation(vv.Map, vv.Dataset.ReadMapBodyList(n)) + ", ";
        fromName = n;
    }
    msg += Animation(vv.Map, initBody);
    vv.Title = msg;
}

