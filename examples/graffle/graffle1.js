Raphael.fn.connection = function (obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox(),
        bb2 = obj2.getBBox(),
        p = [{ x: bb1.x + bb1.width / 2, y: bb1.y - 1 },
        { x: bb1.x + bb1.width / 2, y: bb1.y + bb1.height + 1 },
        { x: bb1.x - 1, y: bb1.y + bb1.height / 2 },
        { x: bb1.x + bb1.width + 1, y: bb1.y + bb1.height / 2 },
        { x: bb2.x + bb2.width / 2, y: bb2.y - 1 },
        { x: bb2.x + bb2.width / 2, y: bb2.y + bb2.height + 1 },
        { x: bb2.x - 1, y: bb2.y + bb2.height / 2 },
        { x: bb2.x + bb2.width + 1, y: bb2.y + bb2.height / 2 }],
        d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x),
                dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
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
    var x1 = p[res[0]].x,
        y1 = p[res[0]].y,
        x4 = p[res[1]].x,
        y4 = p[res[1]].y;
    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
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

//var el;
window.onload = function () {
    var color, i, ii, tempS, tempT;
    var dragger = function () {
        // Original coords for main element
        this.ox = this.type == "ellipse" ? this.attr("cx") : this.attr("x");
        this.oy = this.type == "ellipse" ? this.attr("cy") : this.attr("y");
        if (this.type != "text") this.animate({ "fill-opacity": .2 }, 500);

        // Original coords for pair element
        this.pair.ox = this.pair.type == "ellipse" ? this.pair.attr("cx") : this.pair.attr("x");
        this.pair.oy = this.pair.type == "ellipse" ? this.pair.attr("cy") : this.pair.attr("y");
        if (this.pair.type != "text") this.pair.animate({ "fill-opacity": .2 }, 500);
    };
    var move = function (dx, dy) {
        // Move main element
        var att = this.type == "ellipse" ? { cx: this.ox + dx, cy: this.oy + dy } :
            { x: this.ox + dx, y: this.oy + dy };
        this.attr(att);

        // Move paired element
        att = this.pair.type == "ellipse" ? { cx: this.pair.ox + dx, cy: this.pair.oy + dy } :
            { x: this.pair.ox + dx, y: this.pair.oy + dy };
        this.pair.attr(att);

        // Move connections
        for (i = connections.length; i--;) {
            r.connection(connections[i]);
        }
        // r.safari();
    }
    var up = function () {
        // Fade original element on mouse up
        if (this.type != "text") this.animate({ "fill-opacity": 0 }, 500);

        // Fade paired element on mouse up
        if (this.pair.type != "text") this.pair.animate({ "fill-opacity": 0 }, 500);
    };
    var r = Raphael("holder", 640, 480);
    var connections = [];
    var shapes = [
        r.ellipse(190, 100, 30, 20),
        r.rect(290, 80, 60, 40, 10),
        r.rect(290, 180, 60, 40, 2),
        r.ellipse(450, 100, 20, 20)
    ];

    var texts = [
        r.text(190, 100, "OneOneOneOneOneOneasd"),
        r.text(320, 100, "Two"),
        r.text(320, 200, "Three"),
        r.text(450, 100, "Four")
    ];

    for (i = 0, ii = shapes.length; i < ii; i++) {

        let maxWidth = Math.max(shapes[i].getBBox().width, texts[i].getBBox().width);
        //this.alert(maxWidth);
        //shapes[i].attr(attr1);
        color = Raphael.getColor();
        tempS = shapes[i].attr({
            rx: maxWidth,
            fill: color, stroke: color,
            "fill-opacity": 0,
            "stroke-width": 2, cursor: "move"
        });
        tempT = texts[i].attr({ fill: color, stroke: "none", "font-size": 15, cursor: "move" });
        shapes[i].drag(move, dragger, up);
        texts[i].drag(move, dragger, up);

        // Associate the elements
        tempS.pair = tempT;
        tempT.pair = tempS;
    }
    connections.push(r.connection(shapes[0], shapes[1], "#aabbcc"));
    connections.push(r.connection(shapes[1], shapes[2], "#aabbcc", "#aabbcc|5"));
    connections.push(r.connection(shapes[1], shapes[3], "#aabbcc", "#ff00dd|5"));
};