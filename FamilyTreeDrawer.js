/**
 * Draws the family tree using Raphaeljs.
 * @param {straing} eGovernmentText Full text of the related eGovernment page
 */
function DrawFamilyTree(eGovernmentText) {
    
    // Bugs / known issues:
    // 1. Other spouses is not working
    // 3. Fixed size svg
    // 4. Coordinates of "Oğlunun annesi"
    // 5. "oğlunun annesi", "babasının babası" instead of "oğlu annesi", "babası babası"
    // 6. No connections yet
    // 7. No tooltips yet
    // 8. General look and feel
    // 9. Derived people should look like different than the people existing in the list

    let familyTree = BuildFamilyTree(eGovernmentText);

    // Find relative coordinates of the family members
    FindCoordinates(familyTree);

    // Initialize Raphäel
    // TODO: Dynamic width and height
    var r = Raphael("holder", 5000, 1000);

    // Draw texts and determine the size of each box
    var shapes = [], texts = [];
    let maxWidth = 0;
    for (let i = 0; i < familyTree.length; i++) {
        const member = familyTree[i];
        let nextText = r.text(100, 100, GetFullName(member));
        texts.push(nextText);
        
        let nextWidth = nextText.getBBox().width;
        if (nextWidth > maxWidth) {
            maxWidth = nextWidth;
        }
    }
    
    // Draw boxes and move texts
    const boxHeight = 40;
    for (let i = 0; i < familyTree.length; i++) {
        const member = familyTree[i];
        let memberX = member.X * (maxWidth + 40) + 100;
        let memberY = member.Y * (boxHeight + 40) + 100;
        let nextShape = r.rect(memberX - maxWidth / 2 - 5, memberY - boxHeight / 2, maxWidth + 10, boxHeight, 10);
        shapes.push(nextShape);
        texts[i].attr({
            x: memberX,
            y: memberY
        });
    }


    // Draw connections between boxes
    // Add tooltip


    /*
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
        this.alert(maxWidth);
        //shapes[i].attr(attr1);
        color = Raphael.getColor();
        tempS = shapes[i].attr({
            rx: maxWidth,
            fill: color, stroke: color,
            "fill-opacity": 0,
            "stroke-width": 2, cursor: "move"
        });
        tempT = texts[i].attr({ fill: color, stroke: "none", "font-size": 15, cursor: "move" });
        // shapes[i].drag(move, dragger, up);
        // texts[i].drag(move, dragger, up);

        // Associate the elements
        tempS.pair = tempT;
        tempT.pair = tempS;
    }
    */

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
    else if (person.YakinlikDerecesi == "kendisi") {
        person.Y = numAncestorLayers + 1;
    }
    else { // descendants
        let numWords = person.YakinlikDerecesi.split(" ").length;
        person.Y = numAncestorLayers + 1 + numWords;
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