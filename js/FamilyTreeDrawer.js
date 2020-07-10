
!function () {
    this.DrawFamilyTree = DrawFamilyTree;
    this.GenerateSvg = GenerateSvg;
}();

// Global Family Tree
var familyTree;

/**
 * Draws the family tree using Raphaeljs.
 * @param {string} eGovernmentText Full text of the related eGovernment page
 */
function DrawFamilyTree(eGovernmentText) {

    /* global BuildFamilyTree */
    familyTree = BuildFamilyTree(eGovernmentText);

    if (familyTree === undefined) {
        return false;
    }

    // Find relative coordinates of the family members
    FindCoordinates(familyTree);
    DrawFamilyTreeInternal(familyTree, "holder");
    return true;
}

/**
 * Internal method which actually draws the family tree. 
 * Returns an aray which contains the raphael object and 
 * an array of the transparent boxes which are drawn on top of the real boxes and family member names.
 * @param {Array} familyTree Family tree.
 * @param {string} holder Id of the html element which will contain the family tree.
 */
function DrawFamilyTreeInternal(familyTree, holder) {

    // check & clear the holder
    let holderElem = document.getElementById(holder);
    if (holderElem === undefined) {
        return;
    }
    holderElem.innerHTML = "";

    // Initialize Raphaël
    /* global Raphael */
    let r = Raphael(holder, 100, 100);

    // Draw texts and determine the size of each box
    let texts = [];
    let maxTextWidth = 0;
    for (let i = 0; i < familyTree.length; i++) {
        const member = familyTree[i];
        let nextText = r.text(100, 100, GetFullName(member));
        texts.push(nextText);

        let nextWidth = nextText.getBBox().width;
        if (nextWidth > maxTextWidth) {
            maxTextWidth = nextWidth;
        }
    }

    // Draw boxes and move texts
    /*
    -  --------------         --------------
    h  |<pl>text<pr>|<--hbs-->|<pl>text<pr>|
    -  --------------         --------------
       <--boxWidth-->
    
    h: box height
    pl: padding left
    pr: padding right
    pl + pr = padding
    hbs: horizontal box spacing
    */
    let shapes = [];
    let transparentBoxes = [];
    const boxHeight = 40, horizontalBoxSpacing = 30, verticalBoxSpacing = 40, padding = 10;
    const boxWidth = maxTextWidth + padding;
    let maxX = Math.max.apply(Math, familyTree.map(member => member.X));
    let maxY = Math.max.apply(Math, familyTree.map(member => member.Y));

    for (let i = 0; i < familyTree.length; i++) {
        const member = familyTree[i];
        let textPosX = member.X * (maxTextWidth + horizontalBoxSpacing + padding) + boxWidth / 2 + 10;
        let textPosY = member.Y * (boxHeight + verticalBoxSpacing) + boxHeight / 2 + 10;
        // textPosX and textPosY are centered. Find the upper left corner of the box from this info.
        let boxPosX = textPosX - boxWidth / 2;
        let boxPosY = textPosY - boxHeight / 2;
        let nextShape = r.rect(boxPosX, boxPosY, boxWidth, boxHeight, 10);
        // show the members which don't appear at the original input table as dashed
        if (member.Sira === undefined) {
            nextShape.attr({ "stroke-dasharray": ". " });
        }
        // Draw a transparent box with the same size as the original box and bring it to front, 
        // so that hover works also when the mouse pointer is over the text inside the box.
        let transparentBox = r.rect(boxPosX, boxPosY, boxWidth, boxHeight, 10).attr({ fill: "red", opacity: 0 });
        transparentBox.toFront();
        transparentBoxes.push(transparentBox);

        // Add tooltip
        /* global DrawTooltip, ClearTooltip */
        transparentBox.hover(
            function () {
                DrawTooltip(r, GetTooltipText(member), boxPosX, boxPosY, boxWidth, boxHeight,
                    GetTooltipOrientation(member, maxX, maxY), false);
            },
            function () { ClearTooltip(); }
        );
        shapes.push(nextShape);
        texts[i].attr({
            x: textPosX,
            y: textPosY
        });
        member.Shape = nextShape;
    }

    // Resize the canvas
    // X and Y start with 0. There are maxX and maxY horizontal/vertical spacings, maxX+1 and maxY+1 boxes.
    r.setSize(maxX * (boxWidth + horizontalBoxSpacing) + boxWidth + 20,
        maxY * (boxHeight + verticalBoxSpacing) + boxHeight + 20);
    //r.canvas.style.backgroundColor = "#F00";

    // Draw connections between boxes
    DrawConnections(familyTree, r);

    return [r, transparentBoxes];
}

/**
 * Generates the SVG image of the drawn family tree to be downloaded for the given a element.
 * @param {Object} a html a element to be hrefed.
 */
function GenerateSvg(a) {
    if (familyTree === undefined) {
        return;
    }

    let arr = DrawFamilyTreeInternal(familyTree, "resultsvg");
    let r = arr[0];
    let transparentBoxes = arr[1];

    let maxX = Math.max.apply(Math, familyTree.map(member => member.X));
    let maxY = Math.max.apply(Math, familyTree.map(member => member.Y));
    for (let i = 0; i < familyTree.length; i++) {
        const member = familyTree[i];
        const box = transparentBoxes[i];
        let boxProps = box.attr(["x", "y", "width", "height"]);

        let dataVal = "" + boxProps.x + "_" + boxProps.y;
        box.node.setAttribute("onmouseover", "ShowTooltip(evt, '" + dataVal + "')");
        box.node.setAttribute("onmouseout", "HideTooltip(evt, '" + dataVal + "')");

        DrawTooltip(r, GetTooltipText(member), boxProps.x, boxProps.y, boxProps.width, boxProps.height,
            GetTooltipOrientation(member, maxX, maxY), true);
    }

    let svgOutput = r.toSVG();
    let own = familyTree.find(x => x.YakinlikDerecesi === "kendisi");
    let fileName = "soyağacı.svg";
    if (own !== undefined) {
        fileName = own.Adi + " " + own.Soyadi + " soyağacı.svg";
    }
    a.download = fileName;
    a.type = 'image/svg+xml';
    let blob = new Blob([svgOutput], { "type": "image/svg+xml" });
    var createObjectURL = (window.URL || window.webkitURL || {}).createObjectURL || function () { };
    a.href = createObjectURL(blob);
}

/**
 * Finds the X and Y coordinates of each member of the given family tree.
 * @param {Array} familyTree Family tree containing members whose coordinates to be found.
 */
function FindCoordinates(familyTree) {

    let numAncestorLayers = FindNumberOfAncestorLayers(familyTree);
    let nextXIndex = 0;

    // find descendants who don't have any children
    var people = familyTree.filter(x => (x.Children === undefined || x.Children.length == 0) &&
        (x.YakinlikDerecesi.startsWith("oğlu") || x.YakinlikDerecesi.startsWith("kızı") ||
            x.YakinlikDerecesi.startsWith("kendisi") || x.YakinlikDerecesi.startsWith("torunu")));

    // use the people as a stack. Depth-first traverse, first fathers until no more father is to be found, 
    // then spouses of the fathers.
    while (people.length > 0) {
        let nextPerson = people.pop();
        if (nextPerson.IsVisited == true) {
            continue;
        }

        if (nextPerson.Baba !== undefined) {
            if (nextPerson.Baba.IsVisited == true) {
                let childIndex = nextPerson.Baba.Children.indexOf(nextPerson);
                if (childIndex == 0) {
                    nextPerson.X = nextPerson.Baba.X;
                }
                else {
                    // separate siblings from each other to fit spouses between them
                    let totalSpouses = 0;
                    for (let i = 0; i < childIndex; i++) {
                        const sibling = nextPerson.Baba.Children[i];
                        totalSpouses += GetSpouses(sibling).length;
                    }
                    nextPerson.X = nextPerson.Baba.X + childIndex + totalSpouses;
                }
                nextPerson.Y = nextPerson.Baba.Y + 1;
                nextPerson.IsVisited = true;
                AddSpouses(nextPerson, people);
            }
            else {
                people.push(nextPerson);
                people.push(nextPerson.Baba);
            }
        } else {
            SetYIndex(nextPerson, numAncestorLayers);
            // check if this person is a ancestor or descendant
            // x positions are handled differently in ancestors and descendants.
            // for ancestors, x position is incremented for each "root" ancestor
            // for descendants, descendants not having any parents, i.e. spouses, 
            // are placed next to their partners
            if (nextPerson.Y < numAncestorLayers) {
                // ancestor
                nextPerson.X = nextXIndex++;
            }
            else {
                let spouses = GetSpouses(nextPerson);
                // here, the things get a bit unclear because of lacking enough example outputs 
                if (spouses === undefined || spouses.length != 1) {
                    console.log("Unexpected spouse array. Setting a default X position");
                    nextPerson.X = nextXIndex++;
                }
                else {
                    let spouse = spouses[0];
                    if (spouse.IsVisited == true) {
                        nextPerson.X = spouse.X + GetSpouses(spouse).indexOf(nextPerson) + 1;
                    } 
                    else {
                        // find the X position of the spouse first
                        people.push(spouse);
                        // no need to add nextPerson again as it will be added with 
                        // the AddSpouses at the next call
                        continue;
                    }
                }
            }
            nextPerson.IsVisited = true;
            AddSpouses(nextPerson, people);
        }
    }
}

/**
 * Adds the not visited spouses of the given person to the given array.
 * @param {Object} person Spouses of this person will be added
 * @param {Array} people Array which should hold the spouses
 */
function AddSpouses(person, people) {
    // Add spouses reachable by the children
    switch (person.Cinsiyet) {
        case "E":
            person.Children.forEach(child => {
                if (child.Anne !== undefined && !child.Anne.IsVisited) {
                    people.push(child.Anne);
                }
            });
            break;

        case "K":
            person.Children.forEach(child => {
                if (child.Baba !== undefined && !child.Baba.IsVisited) {
                    people.push(child.Baba);
                }
            });
            break;

        default:
            break;
    }

    // Add spouses not reachable by the children
    if (person.OtherSpouses !== undefined) {
        person.OtherSpouses.forEach(spouse => {
            if (!spouse.IsVisited) {
                people.push(spouse);
            }
        });
    }
}

/**
 * Returns the spouses of the given person.
 * @param {Object} person Person whose spouses to be found.
 */
function GetSpouses(person) {
    // Count spouses reachable by the children
    let spouses = new Map();
    switch (person.Cinsiyet) {
        case "E":
            person.Children.forEach(child => {
                if (child.Anne !== undefined && !(spouses.has(child.Anne))) {
                    spouses.set(child.Anne, true);
                }
            });
            break;

        case "K":
            person.Children.forEach(child => {
                if (child.Baba !== undefined && !(spouses.has(child.Baba))) {
                    spouses.set(child.Baba, true);
                }
            });
            break;

        default:
            break;
    }

    let arr = Array.from(spouses.keys());

    // Get spouses not reachable from the children
    if (person.OtherSpouses !== undefined) {
        person.OtherSpouses.forEach(x => {
            arr.push(x);
        });
    }
    return arr;
}

/**
 * Finds the number of ancestor layers at the family tree.
 * @param {Array} familyTree Family Tree as an array
 */
function FindNumberOfAncestorLayers(familyTree) {
    // find the distance between furthest ancestor and "kendisi"
    let maxAncestorIndex = 0;
    for (let i = 0; i < familyTree.length; i++) {
        const person = familyTree[i];
        let relationIndex = person.YakinlikDerecesi.split(" ").length;
        if ((person.YakinlikDerecesi.startsWith("babası") || person.YakinlikDerecesi.startsWith("annesi")) &&
            relationIndex > maxAncestorIndex) {
            maxAncestorIndex = relationIndex;
        }
    }
    return maxAncestorIndex;
}

/**
 * Sets the Y index of a given person by its YakınlıkDerecesi and total ancestor layers.
 * @param {Object} person Person whose Y index needs to be found.
 * @param {int} numAncestorLayers Maximum ancestor index (ex: "babasının babası" = 2)
 */
function SetYIndex(person, numAncestorLayers) {
    if (person.YakinlikDerecesi.startsWith("babası") || person.YakinlikDerecesi.startsWith("annesi")) {
        let numWords = person.YakinlikDerecesi.split(" ").length;
        person.Y = numAncestorLayers - numWords;
    }
    else if (person.YakinlikDerecesi == "kendisi" || person.YakinlikDerecesi == "eşi") {
        person.Y = numAncestorLayers;
    }
    else { // descendants
        let words = person.YakinlikDerecesi.split(" ");
        let descendantCount = 0;
        words.forEach(element => {
            if (element.startsWith("oğlu") || element.startsWith("kızı")) {
                descendantCount++;
            }
            else if (element.startsWith("torunu")) {
                descendantCount += 2;
            }
            // required for strings like "torununun annesi"
            else if (element.startsWith("annesi") || element.startsWith("babası")) {
                descendantCount--;
            }
        });
        person.Y = numAncestorLayers + descendantCount;
    }
}

/**
 * Returns the full name of a given person
 * @param {Object} person Person whose full name is required
 */
function GetFullName(person) {
    var firstName = person.Adi === undefined ? "-" : person.Adi;
    var lastName = person.Soyadi === undefined ? "" : person.Soyadi;
    return lastName == "" ? firstName : firstName + " " + lastName;
}

/**
 * Draws connections between members of the family tree (parent/child, spouses)
 * @param {Array} familyTree Family tree as an array. Each member of the family tree must have a "Shape" property which 
 * corresponds to the related box in browser.
 * @param {Object} r Raphael object
 */
function DrawConnections(familyTree, r) {
    for (let i = 0; i < familyTree.length; i++) {
        const member = familyTree[i];
        let fatherFound = false;
        let motherFound = false;
        let spouseConnectionDrawn = false;
        if (member.Baba !== undefined) {
            fatherFound = true;
            r.connection(member.Baba.Shape, member.Shape, "#000", "", true);
            spouseConnectionDrawn |= DrawConnectionWithOtherSpouses(r, member, "Baba");
        }
        if (member.Anne !== undefined) {
            motherFound = true;
            if (!fatherFound) {
                // only connect with mother if the member won't be connected to father.
                // if it will be connected to father, father will be connected to mother
                r.connection(member.Anne.Shape, member.Shape, "#000", "", true);
            }
            spouseConnectionDrawn |= DrawConnectionWithOtherSpouses(r, member, "Anne");
        }
        if (fatherFound && motherFound && !spouseConnectionDrawn) {
            r.connection(member.Baba.Shape, member.Anne.Shape, "#000", "", false);
        }
    }
}

/**
 * Connects parents of the member with each other, if the given parent of the member has more than one spouses.
 * Returns true, if during this operation, the given parent is also connected with his/her first spouse.
 * @param {Object} r Raphael object
 * @param {Object} member Family member whose parents are being connected
 * @param {string} parent "Anne" or "Baba"
 */
function DrawConnectionWithOtherSpouses(r, member, parent) {
    if (member[parent].OtherSpouses === undefined) {
        return false;
    }

    let spouseConnectionDrawn = false;
    let allSpouses = member[parent].OtherSpouses.slice();
    let firstSpouse = member[parent] == member.Baba ? member.Anne : member.Baba;
    if (firstSpouse !== undefined) {
        allSpouses.push(firstSpouse);
        spouseConnectionDrawn = true;
    }
    allSpouses.sort(function (a, b) {
        return a.Shape.getBBox().x - b.Shape.getBBox().x;
    });
    if (member[parent].Shape.connected === undefined) {
        member[parent].Shape.connected = {};
    }
    // Draw a direct line with the nearest spouse if not already drawn
    if (member[parent].Shape.connected[allSpouses[0].Shape.id] === undefined) {
        r.connection(member[parent].Shape, allSpouses[0].Shape, "#000", "", false);
        member[parent].Shape.connected[allSpouses[0].Shape.id] = true;
        if (allSpouses[0].Shape.connected === undefined) {
            allSpouses[0].Shape.connected = {};
        }
        allSpouses[0].Shape.connected[member[parent].Shape.id] = true;
    }
    for (let i = 1; i < allSpouses.length; i++) {
        const spouse = allSpouses[i];
        if (member[parent].Shape.connected[spouse.Shape.id] === undefined) {
            // Draw a line avoiding the other spouse boxes 
            r.connection(member[parent].Shape, spouse.Shape, "#000", "", true);
            member[parent].Shape.connected[spouse.Shape.id] = true;
            if (spouse.Shape.connected === undefined) {
                spouse.Shape.connected = {};
            }
            spouse.Shape.connected[member[parent].Shape.id] = true;
        }
    }

    return spouseConnectionDrawn;
}

/**
 * Prepares details of a given person to be displayed at the tooltip.
 * @param {Object} person Person whose tooltip is being prepared.
 */
function GetTooltipText(person) {
    let str = person.YakinlikDerecesi;
    if (person.DogumYeri !== undefined) {
        str += "\nDoğum Yeri: " + person.DogumYeri + "\n" +
            "Doğum Tarihi: " + GetDateAsDDMMYYYY(person.DogumTarihi) + "\n" +
            "Medeni Hali: " + person.MedeniHali + "\n" +
            "Durumu: " + person.Durumu;

        if (person.Durumu === "Ölüm" && person.OlumTarihi !== undefined) {
            str += "\nÖlüm Tarihi: " + GetDateAsDDMMYYYY(person.OlumTarihi);
            if (person.DogumTarihi !== undefined) {
                let age = new Date(person.OlumTarihi - person.DogumTarihi);
                str += " (" + (age.getFullYear() - 1970) + " yaşında)";
            }
        }
    }
    return str;
}

/**
 * Determines the tooltip orientation of a given person according to her position at the family tree.
 * @param {Object} person Person whose tooltip orientation needs to be found
 * @param {number} maxX Maximum X index of the family tree
 * @param {number} maxY Maximum Y index of the family tree
 */
function GetTooltipOrientation(person, maxX, maxY) {
    let leftRight = person.X >= maxX - 1 ? "l" : "r";
    let topBottom = person.Y >= maxY - 1 ? "t" : "b";
    return topBottom + leftRight;
}

/**
 * Formats the given date as "dd/mm/yyyy" and returns the result.
 * @param {Date} date date object
 */
function GetDateAsDDMMYYYY(date) {
    return "" + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
}
