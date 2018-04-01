
!function () {
    this.DrawFamilyTree = DrawFamilyTree
}();

/**
 * Draws the family tree using Raphaeljs.
 * @param {string} eGovernmentText Full text of the related eGovernment page
 */
function DrawFamilyTree(eGovernmentText) {

    /* global BuildFamilyTree */
    let familyTree = BuildFamilyTree(eGovernmentText);

    // Find relative coordinates of the family members
    FindCoordinates(familyTree);

    // Initialize Raphäel
    /*global Raphael */
    var r = Raphael("holder", 100, 100);

    // Draw texts and determine the size of each box
    var shapes = [], texts = [];
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
    const boxHeight = 40, horizontalBoxSpacing = 30, verticalBoxSpacing = 40, padding = 10;
    const boxWidth = maxTextWidth + padding;
    let maxX = 0, maxY = 0;
    for (let i = 0; i < familyTree.length; i++) {
        const member = familyTree[i];
        if (maxX < member.X) {
            maxX = member.X;
        }
        if (maxY < member.Y) {
            maxY = member.Y;
        }
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
        let transparentBox = r.rect(boxPosX, boxPosY, boxWidth, boxHeight, 10).attr({fill: "red", opacity: 0});
        transparentBox.toFront();
        
        // Add tooltip
        /* global DrawTooltip, ClearTooltip */
        transparentBox.hover(
            function () { DrawTooltip(r, GetTooltipText(member), boxPosX, boxPosY, boxWidth, boxHeight, 
                GetTooltipOrientation(member, maxX, maxY)); }, 
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
        (x.YakinlikDerecesi.startsWith("oğlu") || x.YakinlikDerecesi.startsWith("kızı")));

    // use the people as a stack. Depth-first traverse, first fathers until no more father is to be found, 
    // then spouses of the fathers.
    while (people.length > 0) {
        let nextPerson = people.pop();

        if (nextPerson.Baba !== undefined) {
            if (nextPerson.Baba.IsVisited == true) {
                nextPerson.X = nextPerson.Baba.X;
                nextPerson.Y = nextPerson.Baba.Y + 1;
                nextPerson.IsVisited = true;
                AddSpouses(nextPerson, people);
            }
            else {
                people.push(nextPerson);
                people.push(nextPerson.Baba);
            }
        } else {
            nextPerson.X = nextXIndex++;
            SetYIndex(nextPerson, numAncestorLayers);
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
        let numWords = person.YakinlikDerecesi.split(" ").length;
        person.Y = numAncestorLayers + numWords;
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
        if (member.Baba !== undefined) {
            fatherFound = true;
            r.connection(member.Shape, member.Baba.Shape, "#000");
            if (member.Baba.OtherSpouses !== undefined) {
                member.Baba.OtherSpouses.forEach(spouse => {
                    r.connection(member.Baba.Shape, spouse.Shape, "#000");
                });
            }
        }
        if (member.Anne !== undefined) {
            motherFound = true;
            if (!fatherFound) {
                r.connection(member.Shape, member.Anne.Shape, "#000");
            }
            if (member.Anne.OtherSpouses !== undefined) {
                member.Anne.OtherSpouses.forEach(spouse => {
                    r.connection(member.Anne.Shape, spouse.Shape, "#000");
                });
            }
        }
        if (fatherFound && motherFound) {
            r.connection(member.Baba.Shape, member.Anne.Shape, "#000");
        }
    }
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
    return "" + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();
}