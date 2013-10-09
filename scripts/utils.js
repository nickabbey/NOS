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

//returns a fully populated and formatted table the entire contents of the system's main memory
function memoryToTable()
{
    var tblBody = document.createElement("tbody");
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var cellText = null;
    var addressBlock = -1; //keep track of which memory block you're in for figuring out row headings

    //iterate over all installed memory
    for (var i = 0; i < _InstalledMemory ; i++)
    {
        //true for 256/512/768, these rows need to stand out
        if (i % _MemorySegmentSize === 0)
        {
            addressBlock ++;  //For creating row headings
            //TODO - change the background color or something here
        }
        //true for multiples of 8, this is how we know were starting a new row
        if((i)%8 === 0)
        {
            //reset the row and cell
            row =  document.createElement("tr");
            cell = document.createElement("td");

            //build the row label
            var strAddress = (i%_MemorySegmentSize).toString(16);
            strAddress = formatMemoryAddress(strAddress);
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
        else //append the value of the memory at address i to the current row
        {
            //add cells to a row
            cell = document.createElement("td");
            cellText = document.createTextNode(_MainMemory[i].toString(16));
            cell.appendChild(cellText);
            row.appendChild(cell);
        }
    }
    //append the row to the table
    tblBody.appendChild(row);
    return tblBody;
}

//returns a fully populated and formatted table containing current CPU values ("00" for uninitialized CPU)
function cpuToTable()
{
    //set up the initial table
    var tblBody = document.createElement("tbody");
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var cellText = null;

    //first row is headings
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

    cell = document.createElement("td");
    cellText = document.createTextNode("Executing");
    cell.appendChild(cellText);
    row.appendChild(cell);

    //append the header row
    tblBody.appendChild(row);

    //reset the table elements
    row = document.createElement("tr");
    cell = document.createElement("td");
    cellText = null;

    //build the next
    if (_CPU === null)
    {   //if theres no cpu (should only occur on startup, when initializing tables to blank values)
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

        cell = document.createElement("td");
        cellText = document.createTextNode("N/A");
        cell.appendChild(cellText);
        row.appendChild(cell);
    }
    else
    {  //output the contents of the CPU to the second row
        cellText = document.createTextNode(formatMemoryAddress(_CPU.PC));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CPU.Acc));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CPU.Xreg));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CPU.Yreg));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CPU.Zflag));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode((_CPU.isExecuting).toString().toUpperCase());
        cell.appendChild(cellText);
        row.appendChild(cell);
    }

    //append the row containing the actual cpu data
    tblBody.appendChild(row);

    return tblBody;
}

//returns a fully populated and formatted table containing either the current or last completed PCB
function pcbToTable()
{

    //set up the initial table
    var tblBody = document.createElement("tbody");
    var row = document.createElement("tr");
    var cell = document.createElement("td");
    var cellText = null;

    //first row is headings
    row =  document.createElement("tr");
    cell = document.createElement("td");

    cellText = document.createTextNode("PID");
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

    cell = document.createElement("td");
    cellText = document.createTextNode("State");
    cell.appendChild(cellText);
    row.appendChild(cell);

    //append the header row
    tblBody.appendChild(row);

    //reset the table elements
    row = document.createElement("tr");
    cell = document.createElement("td");
    cellText = null;

    //build the next row

    //best case is that there is an active thread to populate the pcb table
    if (_CurrentThread)
    {  //output the contents of the CPU to the second row
        cellText = document.createTextNode(formatMemoryAddress(_CurrentThread.pid));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CurrentThread.acc));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CurrentThread.x));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CurrentThread.y));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CurrentThread.z));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_CurrentThread.state));
        cell.appendChild(cellText);
        row.appendChild(cell);
    }
    //but if there's no active thread, they may be a thread that ran to execution, display that
    else if (_LastPCB)
    {  //output the contents of the CPU to the second row
        cellText = document.createTextNode(formatMemoryAddress(_LastPCB.pid));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_LastPCB.acc));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_LastPCB.x));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_LastPCB.y));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_LastPCB.z));
        cell.appendChild(cellText);
        row.appendChild(cell);

        cell = document.createElement("td");
        cellText = document.createTextNode(formatMemoryAddress(_LastPCB.state));
        cell.appendChild(cellText);
        row.appendChild(cell);
    }
    //otherwise, there is nothing to display (IE: first run before a  thread is active or complete)
    else
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

        cell = document.createElement("td");
        cellText = document.createTextNode("N/A");
        cell.appendChild(cellText);
        row.appendChild(cell);
    }

    //append the row containing the actual cpu data
    tblBody.appendChild(row);

    return tblBody;
}

//for use with the <integer>.toString(16) method, to ensure that memory address strings are always size 2 , even "00"
function formatMemoryAddress(str)
{
    var retVal = str;
    if (retVal.length === 1)
    {   //pad label as needed
        retVal = "0" + str;
    }

    return retVal;
}

//Pretty self explanatory, updates all the tables on the host display
function updateDisplayTables()
{
    //refresh the memory display
    _MemoryTable.innerHTML = "";
    _MemoryTable.appendChild(memoryToTable());

    //refresh CPU display
    _CpuTable.innerHTML = "";
    _CpuTable.appendChild(cpuToTable());

    //refresh pcbTable
    _PcbTable.innerHTML = "";
    _PcbTable.appendChild(pcbToTable());
}