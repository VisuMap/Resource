/File: MapCompare.js
//
//Morphing maps within a group with shared name prefix.
//
//Usage: Create multiple maps with similar settings and shared name prefix.
//Then, activate one map in the main window and run this script.
//
function Animation(mp, bodyList) {
    var moved = mp.MoveBodiesTo(bodyList, 30, 75, 0);
    vv.Sleep(1000);
    return moved;
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
        var g = vw.TheForm;
        g.BringToFront();
        var newTop = f.Top - Math.floor((g.Height - f.Height) / 2);
        g.SetBounds(f.Left + f.Width - 10, newTop, 0, 0, 3);
        msg += Animation(pp, vw.BodyList) + ", ";
    }
    Animation(pp, initBody);
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
    vv.Title = msg;
    Animation(vv.Map, initBody);
}
