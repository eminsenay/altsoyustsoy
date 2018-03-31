var tooltipText, tooltipShape;

/**
 * Draws a tooltip at the given coordinates and the text.
 * @param {Object} r Raphäel object for drawing
 * @param {string} text Text to be displayed at the tooltip
 * @param {number} x X coordinate of the tooltip shape
 * @param {number} y Y coordinate of the tooltip shape
 * @param {bool} topright if the tooltip bubble is at topright or bottomright
 */
function DrawTooltip(r, text, x, y, topright) {

    // draw text somewhere to get its dimensions
    tooltipText = r.text(x, y, text);

    // get text dimensions to obtain tooltip dimensions
    let box = tooltipText.getBBox();

    /*
        The tooltip box will look like the following (topright == true)
         ____________________
         |                  |
         | _________________|
         |/

         or the following (else)

         |\__________________
         |                  |
         |__________________|

        width = box.width + 15 
        height = box.height + 10 (without the dent) + 5 (dent)
    */

    let verticalMultiplier = topright === true ? 1 : -1;

    // move the text to its position
    tooltipText.attr({
        x: x + ((box.width + 15) / 2),
        y: y - verticalMultiplier * (5 + ((box.height + 10) / 2)),
    });

    //draw path for tooltip box
    tooltipShape = r.path(
        // 'M'ove to the 'dent' in the bubble
        "M" + (x) + " " + (y) +
        // 'v'ertically draw a line (left line of the box)
        "v" + -(verticalMultiplier * (box.height + 15)) +
        // 'h'orizontally draw a line (top line of the box)
        "h" + (box.width + 15) +
        // 'v'ertically draw a line (right line of the box)
        "v" + (verticalMultiplier * (box.height + 10)) +
        // 'h'orizontally draw a line (bottom line of the box)
        "h" + -(box.width + 10) +
        // 'Z' closes the figure (and creates the dent)
        "Z").attr({ fill: "white" });

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