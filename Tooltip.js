!function () {
    this.DrawTooltip = DrawTooltip;
    this.ClearTooltip = ClearTooltip;
}();

var tooltipText, tooltipShape;

/**
 * Draws a tooltip at the given coordinates and the text.
 * @param {Object} r Raphäel object for drawing
 * @param {string} text Text to be displayed at the tooltip
 * @param {number} x X coordinate of the tooltip shape
 * @param {number} y Y coordinate of the tooltip shape
 * @param {string} orientation One of the following: 
 * @param {bool} isTransparent true, if the tooltip needs to be drawn as transparent
 * "tr" (top right), "tl" (top left), "br" (bottom right), "bl" (bottom left)
 * default: top right
 */
function DrawTooltip(r, text, x, y, width, height, orientation, isTransparent) {

    // find out the coordinates of the tooltip and multipliers of the bubble according to the given orientation
    let bubbleX;
    let bubbleY;
    let verticalMultiplier;
    let horizontalMultiplier;
    switch (orientation) {
        case "tl":
            verticalMultiplier = 1;
            horizontalMultiplier = -1;
            bubbleX = x + 2;
            bubbleY = y + 2;
            break;

        case "tr":
        default:
            verticalMultiplier = 1;
            horizontalMultiplier = 1;
            bubbleX = x + width - 2;
            bubbleY = y + 2;
            break;

        case "bl":
            verticalMultiplier = -1;
            horizontalMultiplier = -1
            bubbleX = x + 2;
            bubbleY = y + height - 2;
            break;

        case "br":
            verticalMultiplier = -1;
            horizontalMultiplier = 1;
            bubbleX = x + width - 2;
            bubbleY = y + height - 2;
            break;
    }

    // draw text somewhere to get its dimensions
    tooltipText = r.text(bubbleX, bubbleY, text);

    // get text dimensions to obtain tooltip dimensions
    let box = tooltipText.getBBox();

    /*
        The tooltip box will look like one of the following bubbles 
        
        orientation == "tl"             orientation = "tr"
         ____________________           ____________________
         |                  |           |                  |
         |_________________ |           | _________________|
                           \|           |/

         orientation == "bl"            orientation: "br"

         __________________/|           |\__________________
         |                  |           |                  |
         |__________________|           |__________________|

        width = box.width + 15 
        height = box.height + 10 (without the dent) + 5 (dent)
    */

    // move the text to its position
    tooltipText.attr({
        x: bubbleX + horizontalMultiplier * ((box.width + 15) / 2),
        y: bubbleY - verticalMultiplier * (5 + ((box.height + 10) / 2)),
    });

    if (isTransparent === true) {
        tooltipText.attr({ opacity: 0 });
    }

    //draw path for tooltip box
    tooltipShape = r.path(
        // 'M'ove to the 'dent' in the bubble
        "M" + (bubbleX) + " " + (bubbleY) +
        // 'v'ertically draw a line (left line of the box)
        "v" + -(verticalMultiplier * (box.height + 15)) +
        // 'h'orizontally draw a line (top line of the box)
        "h" + (horizontalMultiplier * (box.width + 15)) +
        // 'v'ertically draw a line (right line of the box)
        "v" + (verticalMultiplier * (box.height + 10)) +
        // 'h'orizontally draw a line (bottom line of the box)
        "h" + -(horizontalMultiplier * (box.width + 10)) +
        // 'Z' closes the figure (and creates the dent)
        "Z").attr({ fill: "white" });

    if (isTransparent === true) {
        tooltipShape.attr({ opacity: 0 });
    }
    
    const dataName = "class";
    let dataVal = "" + x + "_" + y;
    tooltipShape.node.setAttribute(dataName, dataVal);
    tooltipText.node.setAttribute(dataName, dataVal);

    //finally put the text in front
    tooltipText.toFront();
}

/**
 * Clears the given tooltip.
 */
function ClearTooltip() {
    tooltipShape.remove();
    tooltipText.remove();
}