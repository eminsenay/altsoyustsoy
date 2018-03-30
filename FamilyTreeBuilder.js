/**
 * Builds a family tree from the given e-Devlet alt soy - üst soy content.
 * @param {string} treeData Content of the e-Devlet page containing the family tree (select all - copy - paste)
 */
function BuildFamilyTree(treeData) {
    var personList = [];
    if (treeData.length <= 0) {
        return;
    }
    var lines = CleanArray(treeData.split("\n"));

    let lineIndex = -1;
    // next line will start with a person
    while (lineIndex < lines.length - 1) {
        var line = lines[++lineIndex];
        if (line.startsWith("AÇIKLAMALAR")) {
            break;
        }
        var parts = CleanArray(line.split("\t"));
        if (parts.length == 0) {
            continue;
        }
        let lineNo = parseInt(parts[0]);
        if (isNaN(lineNo)) {
            continue;
        }

        var person = new Object();
        person.Children = [];
        person.Sira = lineNo;
        person.Cinsiyet = parts[1].trim();
        person.YakinlikDerecesi = parts[2].trim();
        person.Adi = parts[3].trim();
        person.Soyadi = parts[4].trim();
        person.BabaAdi = parts[5].trim();
        person.AnaAdi = parts[6].trim();
        person.DogumYeri = parts[7].trim();

        // 01/07/1837	Sivas/
        line = lines[++lineIndex];
        parts = CleanArray(line.split("\t"));
        person.DogumTarihi = parts[0].trim();
        person.Il = parts[1].trim();

        // Divriği /
        line = lines[++lineIndex];
        parts = CleanArray(line.split("\t"));
        person.Ilce = parts[0].trim();

        // AŞAĞIHAMAM MAHALLESİ    4 - 24 - 5  Dul Sağ
        line = lines[++lineIndex];
        parts = CleanArray(line.split("\t"));
        person.MahalleKoy = parts[0].trim();
        person.CiltHaneBirey = parts[1].trim();
        person.MedeniHali = parts[2].trim();
        person.Durumu = parts[3].trim();

        // -
        line = lines[++lineIndex];
        parts = CleanArray(line.split("\t"));
        person.Durumu += parts[0].trim();

        personList.push(person);
    }

    BuildFamilyRelations(personList); // only ancestors and descendants
    CreateNonExistingAncestors(personList);
    BuildOtherSpouses(personList); // non reachable ancestors
    return personList;
}

/**
 * Removes all falsy values: undefined, null, 0, false, NaN and "" (empty string)
 * @param {Array} actual Array of strings
 */
function CleanArray(actual) 
{
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) 
    {
        if (actual[i]) 
        {
            newArray.push(actual[i]);
        }
    }
    return newArray;
}

/**
 * Checks the father and mother name of each family tree member and creates new virtual entries. 
 * @param {Array} familyTree Family tree which contains the person, her ancestors and descendants
 */
function CreateNonExistingAncestors(familyTree) {
    var newMembers = [];
    for (let i = 0; i < familyTree.length; i++) {
        const person = familyTree[i];
        if (person.Anne === undefined || !IsSimilar(person.Anne.Adi, person.AnaAdi)) {
            let anne = new Object();
            anne.Adi = person.AnaAdi;
            anne.Children = [person];
            anne.Cinsiyet = "K";
            anne.YakinlikDerecesi = person.YakinlikDerecesi == "oğlu" || person.YakinlikDerecesi == "kızı" ? "eşi" : 
                person.YakinlikDerecesi + GetPossessiveSuffix(person.YakinlikDerecesi) + " annesi";
            person.Anne = anne;
            newMembers.push(anne);
        }
        if (person.Baba === undefined || !IsSimilar(person.Baba.Adi, person.BabaAdi)) {
            let baba = new Object();
            baba.Adi = person.BabaAdi;
            baba.Children = [person];
            baba.Cinsiyet = "E";
            baba.YakinlikDerecesi = person.YakinlikDerecesi == "oğlu" || person.YakinlikDerecesi == "kızı" ? "eşi" : 
                person.YakinlikDerecesi + GetPossessiveSuffix(person.YakinlikDerecesi) + " babası";
            person.Baba = baba;
            newMembers.push(baba);
        }
    }
    newMembers.forEach(x=>familyTree.push(x));
}

/**
 * Checks the similarity of given 2 names. Returns true if they are different up to 1 letter.
 * @param {string} name1 First Name
 * @param {string} name2 Second Name
 */
function IsSimilar(name1, name2) {
    if (name1 == null || name2 == null) {
        return false;
    }
    const name1Arr = name1.split("");
    const name2Arr = name2.split("");
    if (name1Arr.length != name2Arr.length) {
        return false;
    }
    let numDifferences = 0;
    for (let i = 0; i < name1Arr.length; i++) {
        if (name1Arr[i] != name2Arr[i]) {
            numDifferences++;
        }
    }
    return numDifferences <= 1;
}

/**
 * Builds the relationships (ancestors and descendants) of the given family tree.
 * @param {Array} familyTree Family tree which contains the person, her ancestors and descendants
 */
function BuildFamilyRelations(familyTree) {
    // normalization
    familyTree.forEach(x => { x.YakinlikDerecesi = x.YakinlikDerecesi.toLocaleLowerCase("tr-TR") });

    // start
    var own = familyTree.find(x => x.YakinlikDerecesi == "kendisi");
    if (own === undefined) {
        return;
    }
    BuildAncestors(own, familyTree);
    BuildDescendants(own, familyTree);
}

/**
 * Builds the ancestors of a given person.
 * @param {Object} person The person, whose ancestors need to be built
 * @param {Array} familyTree Family tree which contains the person, her ancestors and descendants
 */
function BuildAncestors(person, familyTree) {
    if (person.YakinlikDerecesi == "kendisi") {
        let father = familyTree.find(x => x.YakinlikDerecesi == "babası");
        person.Baba = father;
        person.Baba.Children.push(person);

        let mother = familyTree.find(x => x.YakinlikDerecesi == "annesi");
        person.Anne = mother;
        person.Anne.Children.push(person);

        if (father != null) {
            BuildAncestors(father, familyTree);
        }
        if (mother != null) {
            BuildAncestors(mother, familyTree);
        }
    }
    else {
        let relationIndex = person.YakinlikDerecesi.split(" ").length;
        let fatherFound = false, motherFound = false;
        for (let i = 0; i < familyTree.length; i++) {
            const nextPerson = familyTree[i];
            var words = nextPerson.YakinlikDerecesi.split(" ");
            if (words.length - relationIndex == 1) {
                if (nextPerson.YakinlikDerecesi.startsWith(person.YakinlikDerecesi)) {
                    switch (words[words.length - 1]) {
                        case "babası":
                            if (IsSimilar(person.BabaAdi, nextPerson.Adi)) {
                                person.Baba = nextPerson;
                                person.Baba.Children.push(person);
                            }
                            fatherFound = true;
                            BuildAncestors(nextPerson, familyTree);
                            break;
                        case "annesi":
                            if (IsSimilar(person.AnaAdi, nextPerson.Adi)) {
                                person.Anne = nextPerson;
                                person.Anne.Children.push(person);
                            }
                            motherFound = true;
                            BuildAncestors(nextPerson, familyTree);
                            break;
                    }
                }
            }
            if (fatherFound && motherFound) {
                break;
            }
        }
    }
}

/**
 * Builds the descendants of a given person.
 * @param {Object} person The person, whose descendants need to be built
 * @param {Array} familyTree Family tree which contains the person, her ancestors and descendants
 */
function BuildDescendants(person, familyTree) {
    if (person.YakinlikDerecesi == "kendisi") {
        let sons = familyTree.filter(x => x.YakinlikDerecesi == "oğlu");
        for (let i = 0; i < sons.length; i++) {
            const son = sons[i];
            person.Children.push(son);
            if (person.Cinsiyet == "E") {
                son.Baba = person;
            }
            else {
                son.Anne = person;
            }
            BuildDescendants(son, familyTree);
        }
        let daughters = familyTree.filter(x => x.YakinlikDerecesi == "kızı");
        for (let i = 0; i < daughters.length; i++) {
            const daughter = daughters[i];
            person.Children.push(daughter);
            if (person.Cinsiyet == "E") {
                daughter.Baba = person;
            }
            else {
                daughter.Anne = person;
            }
            BuildDescendants(daughter, familyTree);
        }
    } else {
        let relationIndex = person.YakinlikDerecesi.split(" ").length;
        for (let i = 0; i < familyTree.length; i++) {
            const nextPerson = familyTree[i];
            let words = nextPerson.YakinlikDerecesi.split(" ");
            if (words.length - relationIndex != 1) {
                continue;
            }
            if (!nextPerson.YakinlikDerecesi.startsWith(person.YakinlikDerecesi)) {
                continue;
            }
            if (words[words.length - 1] != "oğlu" && words[words.length - 1] != "kızı") {
                continue;
            }

            person.Children.push(nextPerson);
            if (person.Cinsiyet == "E") {
                nextPerson.Baba = person;
            }
            else {
                nextPerson.Anne = person;
            }
            BuildDescendants(nextPerson, familyTree);
        }
    }
}

/**
 * Links people who cannot be reached from parent/child relationship to their spouses. 
 * This case can occur with multiple marriages.
 * @param {Array} familyTree Family tree which contains the person, her ancestors and descendants
 */
function BuildOtherSpouses(familyTree) {
    familyTree.forEach(person => {
        if ((person.Children === undefined || person.Children.length == 0) &&
            (person.YakinlikDerecesi.includes("annesi") || person.YakinlikDerecesi.includes("babası"))) {
            // Link with YakınlıkDerecesi
            let lastSpaceIndex = person.YakinlikDerecesi.lastIndexOf(" ");
            if (lastSpaceIndex == -1) {
                console.log("Build Other Spouses encountered with a family member not containing any spaces.");
                return;
            }
            let strToSearch = person.YakinlikDerecesi.slice(0, lastSpaceIndex);

            // Search for the family member whose YakınlıkDerecesi is exactly same until the last word
            for (let i = 0; i < familyTree.length; i++) {
                const nextPerson = familyTree[i];
                if (nextPerson == person) {
                    continue;
                }
                let lastSpaceIndexNextPerson = nextPerson.YakinlikDerecesi.lastIndexOf(" ");
                if (lastSpaceIndexNextPerson == -1) {
                    continue;
                }
                let finalStr = nextPerson.YakinlikDerecesi.slice(0, lastSpaceIndexNextPerson);
                if (strToSearch != finalStr) {
                    continue;
                }

                if (nextPerson.OtherSpouses === undefined) {
                    nextPerson.OtherSpouses = [person];
                } else {
                    nextPerson.OtherSpouses.push(person);
                }
            }
        }
    });
}

/**
 * Finds the possesive suffix with the buffer letter of a given string. 
 * Assumption: String is one of the family tree relations
 * @param {Object} str string whose possesive suffix is to be found.
 */
function GetPossessiveSuffix(str) {
    if (str.endsWith("babası") || str.endsWith("kızı")) {
        return "nın";
    }
    else if (str.endsWith("annesi")) {
        return "nin";
    }
    else if (str.endsWith("oğlu"))
    {
        return "nun";
    }
    else {
        console.log("Unknown relation at FindPossessiveSuffix. String: " + str);
    }
}