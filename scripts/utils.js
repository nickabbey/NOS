/* --------  
   Utils.js

   Utility functions.
   -------- */

function trim(str) {     // Use a regular expression to remove leading and trailing spaces.
	return str.replace(/^\s+ | \s+$/g, "");
	/* 
	Huh?  Take a breath.  Here we go:
	- The "|" separates this into two expressions, as in A or B.
	- "^\s+" matches a sequence of one or more whitespace characters at the beginning of a string.
    - "\s+$" is the same thing, but at the end of the string.
    - "g" makes is global, so we get all the whitespace.
    - "" is nothing, which is what we replace the whitespace with.
	*/
	
}

function rot13(str) {   // An easy-to understand implementation of the famous and common Rot13 obfuscator.
                        // You can do this in three lines with a complex regular expression, but I'd have
    var retVal = "";    // trouble explaining it in the future.  There's a lot to be said for obvious code.
    for (var i in str) {
        var ch = str[i];
        var code = 0;
        if ("abcedfghijklmABCDEFGHIJKLM".indexOf(ch) >= 0) {
            code = str.charCodeAt(i) + 13;  // It's okay to use 13.  It's not a magic number, it's called rot13.
            retVal = retVal + String.fromCharCode(code);
        } else if ("nopqrstuvwxyzNOPQRSTUVWXYZ".indexOf(ch) >= 0) {
            code = str.charCodeAt(i) - 13;  // It's okay to use 13.  See above.
            retVal = retVal + String.fromCharCode(code);
        } else {
            retVal = retVal + ch;
        }
    }
    return retVal;
}

function qotd() //gets a quote of the day from the internet
                //uses a script specified by <div id="divQuote" class="hidden"> of index.html.
{
    //hope for the best, expect the worst
    var output = "Failed!";

    // {} block solely for aesthetic purposes. The IDE folds it and I get to continue believing that my code is pretty
    {
    //so dirty....  http://www.youtube.com/watch?v=HEbnc73ItCE

    //text = everything from divQuote
        var text = document.getElementById('divQuote').innerHTML.toString();

        //guard, if this fails return is "Failed!"   //TODO get the quotd guard working
//        if (text.type === "string" && text.length >= 0 )
        {
            //trim everything preceding first <br> tag
            var text = text.substring((text.indexOf('<br>') + 5));  //magic number for length of '<br>' + 1

            //this handles the quote part
            var quote = text.substring(0, (text.indexOf('<br>')));

            //author requires 2 steps, first trim out all before end of anchor open tag
            var author = text.substring(text.indexOf('">') + 2);  //magic number for length of '">'
            //then trim from start to first char in position of anchor close tag
            author = author.substring(0, author.indexOf('</a>'));
            output = quote + " - " + author;
        }
    }
    //console.log(quote + " - " + author);
    return(output);
}

//returns a table 768 rows by 8 colums
function memoryToTable()
{
    var tblBody = document.createElement("tbody");
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var cellText = null;
    var addressBlock = -1; //divisor for figuring out row headings

    for (var i = 0; i < _InstalledMemory ; i++)
    {
        if (i % _MemorySegmentSize === 0)
        {
            addressBlock ++;  //For creating row headings
        }
        //add rows with headers to the table every 8 addresses
        if((i)%8 === 0)
        {  //0,256,512, 768
            //reset the row and cell
            row =  document.createElement("tr");
            cell = document.createElement("td");

            //build the row label
            var strAddress = (i%_MemorySegmentSize).toString(16);
            if (strAddress.length === 1)
            {   //pad label as needed
                strAddress = "0" + strAddress;
            }
            cellText = document.createTextNode("$" + addressBlock + strAddress);
            cell.appendChild(cellText);
            row.appendChild(cell);

            //and add the contents of the first cell
            cell = document.createElement("td");
            cellText = document.createTextNode(_MainMemory[i].toString(16));
            cell.appendChild(cellText);
            row.appendChild(cell);

            tblBody.appendChild(row);
        }
        else //otherwise, add the value of the memory at address i to the row
        {
            //add cells to a row
            cell = document.createElement("td");
            cellText = document.createTextNode(_MainMemory[i].toString(16));
            cell.appendChild(cellText);
            row.appendChild(cell);
        }
    }
    tblBody.appendChild(row);
    return tblBody;
}

function cpuToTable()
{
    var tblBody = document.createElement("tbody");
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var cellText = null;

    //reset the row and cell
    row =  document.createElement("tr");
    cell = document.createElement("td");

    cellText = document.createTextNode("PC");
    cell.appendChild(cellText);
    row.appendChild(cell);

    cell = document.createElement("td");
    cellText = document.createTextNode("ACC");
    cell.appendChild(cellText);
    row.appendChild(cell);

    cell = document.createElement("td");
    cellText = document.createTextNode("X");
    cell.appendChild(cellText);
    row.appendChild(cell);

    cell = document.createElement("td");
    cellText = document.createTextNode("Y");
    cell.appendChild(cellText);
    row.appendChild(cell);

    cell = document.createElement("td");
    cellText = document.createTextNode("Z");
    cell.appendChild(cellText);
    row.appendChild(cell);

    //append the header row
    tblBody.appendChild(row);

    //reset the table elements
    row = document.createElement("tr");
    cell = document.createElement("td");
    cellText = null;

    //build the next row
    if (_CPU === null)
    {
        cellText = document.createTextNode("00");
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode("00");
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode("00");
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode("00");
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode("00");
        cell.appendChild(cellText);
        row.appendChild(cell);
    }
    else
    {
        cellText = document.createTextNode(_CPU.pc.toString());
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(_CPU.acc.toString());
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(_CPU.x.toString());
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(_CPU.y.toString());
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(_CPU.z.toString());
        cell.appendChild(cellText);
        row.appendChild(cell);
    }

    //append the row containing the actual cpu data
    tblBody.appendChild(row);

    return tblBody;
}

function pcbToTable()
{
    var tblBody = document.createElement("tbody");
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var cellText = null;

    //reset the row and cell
    row =  document.createElement("tr");
    cell = document.createElement("td");

    cellText = document.createTextNode("_");
    cell.appendChild(cellText);
    row.appendChild(cell);

    tblBody.appendChild(row);

    return tblBody;
}