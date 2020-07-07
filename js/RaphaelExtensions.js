/* global Raphael */
/**
 * Draws undirected connection lines between the given Raphael rectangles
 * @param {object} obj1 First raphael rectangle 
 * @param {object} obj2 Second raphael rectangle
 * @param {string} line Line color 
 * @param {string} bg Bsackground color and thickness (such as "#aaa|10") 
 * @param {boolean} perpendicular If true, objects between obj1 and obj2 won't be crossed. 
 * This doesn't work for all box positions. Check the code comments for more info.
 */
Raphael.fn.connection = function (obj1, obj2, line, bg, perpendicular) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox();
    var bb2 = obj2.getBBox();

    //  ________            1___p[0]___
    // |        |           |          |
    // |        |   --> p[2]|          | p[3]  1:(bb1.x,bb1.y)
    // |________|           |___p[1]___|
    //

    var p = [{ x: bb1.x + bb1.width / 2, y: bb1.y - 1 },
    { x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1 },
    { x: bb1.x - 1, y: bb1.y + bb1.height / 2 },
    { x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2 },
    { x: bb2.x + bb2.width / 2, y: bb2.y - 1 },
    { x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1 },
    { x: bb2.x - 1, y: bb2.y + bb2.height / 2 },
    { x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2 }];
    var d = {};
    var dis = [];
    // find which edges of the boxes will be connected by calculating the shortest distance
    //  
    //    ____0____         ____4____       --> x
    //   |         |       |         |     |
    // 2 |   obj1  | 3   6 |   obj2  | 7   |
    //   |____1____|       |____5____|     v   y
    //   
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            // find the distance of the points existing at p for the obj2 with the ones for the obj1
            var dx = Math.abs(p[i].x - p[j].x);
            var dy = Math.abs(p[i].y - p[j].y);
            if (
                (i == j - 4) ||
                (
                    ((i != 3 && j != 6) || p[i].x < p[j].x) &&
                    ((i != 2 && j != 7) || p[i].x > p[j].x) &&
                    ((i != 0 && j != 5) || p[i].y > p[j].y) &&
                    ((i != 1 && j != 4) || p[i].y < p[j].y)
                )
            ) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x;
    var y1 = p[res[0]].y;
    var x4 = p[res[1]].x;
    var y4 = p[res[1]].y;
    var path;
    if (perpendicular === true && res[0] == 3 && res[1] == 6) {
        // Perpendicular only works for res = [3, 6]

        if (y1 == y4) {
            // boxes are at the same level

            // draw a connection like the following:
            // __         __        1__5        8__4
            //   |_______|    -->      |________|
            //                         6        7

            let x5 = (x1 + 10).toFixed(3);
            let y5 = y1.toFixed(3);
            let x6 = x5;
            let y6 = (bb1.y + bb1.height + 10).toFixed(3);
            let x7 = (x4 - 10).toFixed(3);
            let y7 = (bb2.y + bb2.height + 10).toFixed(3);
            let x8 = x7;
            let y8 = y4.toFixed(3);

            path = ["M", x1.toFixed(3), y1.toFixed(3),
                "L", x5, y5,
                "L", x6, y6,
                "L", x7, y7,
                "L", x8, y8,
                "L", x4.toFixed(3), y4.toFixed(3)].join(",");
        }
        else if (y1 > y4) {
            // obj1 is on top of obj2
            
            // draw a connection like the following
            //
            //  _____                           _____                       
            // |     |                         |     |                       
            // |_____|                         |_____|                       
            //    |                              1|                          
            //    |________               -->     |________6                  
            //            |       ______          5       |       ______       
            //            |______|      |                 |______|      |        
            //                   |______|                 7     4|______|         

            x1 = p[1].x.toFixed(3);
            y1 = p[1].y.toFixed(3);
            let x5 = x1;
            let y5 = (y1 + 10).toFixed(3);
            let x7 = (x4 - 10).toFixed(3);
            let y7 = y4;
            let x6 = x7;
            let y6 = y5;

            path = ["M", x1, y1,
                "L", x5, y5,
                "L", x6, y6,
                "L", x7, y7,
                "L", x8, y8,
                "L", x4.toFixed(3), y4.toFixed(3)].join(",");
        }
        else {
            console.log("Unexpected connection request. obj1 is bottom of obj2");
        }
    }
    else {
        dx = Math.max(Math.abs(x1 - x4) / 2, 10);
        dy = Math.max(Math.abs(y1 - y4) / 2, 10);
        var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3);
        var y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3);
        var x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3);
        var y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
        path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
    }

    if (line && line.line) {
        line.bg && line.bg.attr({ path: path });
        line.line.attr({ path: path });
    } else {
        var color = typeof line == "string" ? line : "#000";
        return {
            bg: bg && bg.split && this.path(path).attr({ stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3 }),
            line: this.path(path).attr({ stroke: color, fill: "none" }),
            from: obj1,
            to: obj2
        };
    }
};
