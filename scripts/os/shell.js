/* ------------
   Shell.js
   
   The OS Shell - The "command line interface" (CLI) for the console.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

//
// Prototype definition for Shell "class"
//
function Shell()
{
    // Properties
    this.promptStr      = ">";
    this.commandList    = [];           //holds shell commands created in init
    this.curses         = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
    this.apologies      = "[sorry]";

    // Methods
    this.putPrompt      = function()
    {
        _StdIn.putText(this.promptStr);
    };

    this.init           = function()
    {

        var sc = null;
        // Load the command list.

        // ver
        sc = new ShellCommand();
        sc.command = "ver";
        sc.description = "- Displays the current version data.";
        sc.function = shellVer;
        this.commandList[this.commandList.length] = sc;

        // help
        sc = new ShellCommand();
        sc.command = "help";
        sc.description = "- This is the help command. Seek help.";
        sc.function = shellHelp;
        this.commandList[this.commandList.length] = sc;

        // shutdown
        sc = new ShellCommand();
        sc.command = "shutdown";
        sc.description = "- Shuts down the virtual OS but leaves the underlying hardware simulation running.";
        sc.function = shellShutdown;
        this.commandList[this.commandList.length] = sc;

        // cls
        sc = new ShellCommand();
        sc.command = "cls";
        sc.description = "- Clears the screen and resets the cursor position.";
        sc.function = shellCls;
        this.commandList[this.commandList.length] = sc;

        // man <topic>
        sc = new ShellCommand();
        sc.command = "man";
        sc.description = "<topic> - Displays the MANual page for <topic>.";
        sc.function = shellMan;
        this.commandList[this.commandList.length] = sc;

        // trace <on | off>
        sc = new ShellCommand();
        sc.command = "trace";
        sc.description = "<on | off> - Turns the OS trace on or off.";
        sc.function = shellTrace;
        this.commandList[this.commandList.length] = sc;

        // rot13 <string>
        sc = new ShellCommand();
        sc.command = "rot13";
        sc.description = "<string> - Does rot13 obfuscation on <string>.";
        sc.function = shellRot13;
        this.commandList[this.commandList.length] = sc;

        // prompt <string>
        sc = new ShellCommand();
        sc.command = "prompt";
        sc.description = "<string> - Sets the prompt.";
        sc.function = shellPrompt;
        this.commandList[this.commandList.length] = sc;

        // date
        sc = new ShellCommand();
        sc.command = "date";
        sc.description = "- Prints the date/time.";
        sc.function = function shellDate() {
            _StdIn.putText(new Date().toString());
        };
        this.commandList[this.commandList.length] = sc;

        // whereami
        sc = new ShellCommand();
        sc.command = "whereami";
        sc.description = "- Wherever you go, you are there.";
        sc.function = function shellWhereAmI() {
            _StdIn.putText("There you are!");
        };
        this.commandList[this.commandList.length] = sc;

        // qotd
        sc = new ShellCommand();
        sc.command = "qotd";
        sc.description = "- Quote of the day";
        sc.function = function shellQotd() {
            _StdIn.putText(qotd());
        };
        this.commandList[this.commandList.length] = sc;

        // status
        sc = new ShellCommand();
        sc.command = "status";
        sc.description = "- Send a status to the host";
        sc.function = function shellStatus(status) {
            hostStat(status);
        };
        this.commandList[this.commandList.length] = sc;

        // BSOD test
        sc = new ShellCommand();
        sc.command = "bsod";
        sc.description = "- NO DISASSEMBLE JOHNNY 5!!!";
        sc.function = function shellBSOD() {
            krnTrapError("BSOD TEST");
        };

        this.commandList[this.commandList.length] = sc;

        // Load
        sc = new ShellCommand();
        sc.command = "load";
        sc.description = "- Load a user program";
        sc.function = function shellLoadProgram() {
            //TODO improve this so that more threads can be loaded out to disk
            if (_ThreadList.length < MAX_TRHEADS)
            {
                //get the user code
                var program = document.getElementById("taProgramInput").value;
                //format it
                program = trim(program.toUpperCase());
                //display it
                _StdIn.putLine(program);
                //verify it
                if (shellProgramValidation(program))
                {   //opcodes verified

                    var opCodes = program.split(" ");

                    var newPcb = new Pcb("NEW", _NextPID, -1, -1);
                    _StdOut.putLine("Program is valid, created process with PID: " + _NextPID);
                    _NextPID++;

                    var didLoad = _MMU.rollIn(newPcb, opCodes);
                    if(didLoad)
                    {
                        _StdOut.putLine("Loaded Process with PID: " + newPcb.pid);
                    }
                    else
                    {
                        _StdOut.putLine("Failed to load Process with PID: " + newPcb.pid + ". Did you format?");
                    }

                }
                else
                {   //opCodes were invalid
                    _StdOut.putLine("Program is invalid");
                }
            }
            else
            {
                _StdOut.putLine("Too many programs loaded, run or kill a process.");
            }

        };

        this.commandList[this.commandList.length] = sc;

        // Run
        sc = new ShellCommand();
        sc.command = "run";
        sc.description = "- Run a user program";
        sc.function = function shellRunProgram(param) {

            //TODO - Move run in to the kernel (for consistency, since runall is there)
            if (param.length === 0)
            {   //the pid is empty
                _StdIn.putLine('Please specify a process ID.  (Hint: list processes with "ps" command');
            }
            else
            {   //A PID was given
                var pidIndex = shellGetPidIndex(param);

                //update to see if that PID was found
                if (pidIndex != null)
                {   //when it exists, we can run it

                    //set the current thread to the one specified and let the user know
                    _CurrentThread = _ThreadList[pidIndex];
                    _StdIn.putLine("Executing user PID " + (_CurrentThread.pid).toString());

                    //reset CPU
                    _CPU.reset();

                    //set CPU execution based on whether or not stepping is enabled
                    if(_StepStatus)
                    {
                        _CPU.isExecuting = false;
                    }
                    else
                    {
                        _CPU.isExecuting = true;
                    }

                    //set the thread state based on _CPU execution status
                    if (_CPU.isExecuting)
                    {
                        _CurrentThread.state = "RUNNING";
                    }
                    else
                    {
                        _CurrentThread.state = "SUSPENDED";
                    }
                }
                else
                {   //when the pid is null, however, we cannot actually do anything
                    _StdIn.putLine("No process found with that PID.")
                }
            }

            //update the pcb display to reflect initial state
            updateDisplayTables();
        };

        this.commandList[this.commandList.length] = sc;

        // Runall
        sc = new ShellCommand();
        sc.command = "runall";
        sc.description = "- Run all loaded user programs";
        sc.function = function shellRunAll() {

            //update for loaded threads
            if (_ThreadList.length > 0)
            {   //true any time there's something on the _ThreadList

                //the kernel will execute the threads
                krnRunAll();
            }
            else
            {   //there were no processes, let the user know
                _StdIn.putLine("There are no processes loaded");
            }

            //update the pcb display to reflect initial state
            updateDisplayTables();
        };

        this.commandList[this.commandList.length] = sc;

        // Kill
        sc = new ShellCommand();
        sc.command = "kill";
        sc.description = "- Kill a program with the given pid";
        sc.function = function shellKillProgram(param) {

            if (param.length === 0)
            {   //the pid given is either not a number or doesn't correspond to a loaded thread
                _StdIn.putLine('Please specify a process ID.  (Hint: list processes with "ps" command');
            }
            else
            {   //A PID was given
                var pidIndex = shellGetPidIndex(param);

                if (pidIndex != null)
                {
                    krnKillProgram(pidIndex);
                }
                else
                {   //when the pid is null, however, we cannot actually do anything because the thread wasn't found
                    _StdIn.putLine("No process found with that PID.")
                }
            }
            //update the pcb display to reflect initial state
            updateDisplayTables();
        };

        this.commandList[this.commandList.length] = sc;

        // Step
        //TODO - later revisions of run will require a PID parameter
        sc = new ShellCommand();
        sc.command = "step";
        sc.description = "- Enable single step operation for a process";
        sc.function = function shellStep() {
            //TODO needs to be reworked now that the scheduler is implemented
            //simulate the action of checking/unchecking the single step box
//            document.getElementById('chkStep').checked = !(document.getElementById('chkStep').checked);
//            //call the host routine that does the actual work
//            hostChkStep();
            _StdIn.putLine("Stepping feature disabled.");
        };

        this.commandList[this.commandList.length] = sc;

        // ps
        sc = new ShellCommand();
        sc.command = "ps";
        sc.description = "- List processes loaded in memory";
        sc.function = function shellPs() {
            for (var i = 0; i < _ThreadList.length; i++)
            {
                _StdOut.putLine("PID: "     + (_ThreadList[i].pid).toString() +
                                " State: "  + (_ThreadList[i].state).toString());
            }
        };

        this.commandList[this.commandList.length] = sc;

        // quantum
        sc = new ShellCommand();
        sc.command = "quantum";
        sc.description = "- Sets or changes the round robin quantum";
        sc.function = function shellQuantum(param) {

            if (param.length === 0)
            {   //the quantum was not entered
                _StdIn.putLine("Quantum = " + _Quantum);
                _StdIn.putLine("Quantum <int> - sets the quantum to <int>.");
            }
            else
            {   //A quantum was given
                _Quantum = parseInt(param[0]);
                _StdIn.putLine("Quantum = " + _Quantum);
            }
        };

        this.commandList[this.commandList.length] = sc;

        // format
        sc = new ShellCommand();
        sc.command = "format";
        sc.description = "- Format a hard drive (on diskID '<string>')";
        sc.function = function shellFormat(params) {
            if (params.length === 0)
            {
                krnFormatDisk([HDD_IRQ_CODES[0], 0]);
            }
            else
            {
                krnFormatDisk([HDD_IRQ_CODES[0], params[0]]);
            }
        };

        this.commandList[this.commandList.length] = sc;

        // create
        sc = new ShellCommand();
        sc.command = "create";
        sc.description = "- Create file named '<string1>' (on disk '<string2>')";
        sc.function = function shellCreate(params) {

            //first part of creation parameter array is the code for file creation
            var createParameters = [HDD_IRQ_CODES[1],params[0], FS_ACTIVE_HDD];

            if (params[1])
            {
                createParameters[2] = params[1];
            }

            //if we got a valid filename, add it to the parameters
            if(params[0] && shellVerifyFileName(params[0]))
            {   //we got a good filename

                //but did we get a disk ID?
                krnCreateFile(createParameters);
            }
            else
            {   //we didn't

                //so let the user know
                _StdOut.putLine("Unable to create file")
            }
        };

        this.commandList[this.commandList.length] = sc;

        // delete
        sc = new ShellCommand();
        sc.command = "delete";
        sc.description = "- Delete file named '<string1>' (on disk '<string2>')";
        sc.function = function shellDelete(params) {

            //was the minimum requirement of a filename given?
            if (params.length === 0)
            {   //when it's not, tell the user
                _StdIn.putLine("please specify a filename (and optional disk id.)");
            }
            //was a filename given without a disk id?
            else if (params.length ===1)
            {  //when it was, pad the parameters for the kernel routine with a null at index 2
                krnDeleteFile([HDD_IRQ_CODES[2],params[0], null]);
            }
            //otherwise, a full set of params was given
            else
            {   //so just pass them along to the driver
                krnDeleteFile([HDD_IRQ_CODES[2], params[0], params[1]]);
            }
        };

        this.commandList[this.commandList.length] = sc;

        // write
        sc = new ShellCommand();
        sc.command = "write";
        sc.description = '- overwrite <string1> file with "<string2>" (quotes required)';
        sc.function = function shellWrite(params) {
            if (params.length > 0)
            {
                //accounting for spaces and quotes takes a bunch of work
                var data = "";

                //first we need to break up the data parameter (to handle spaces)
                for (var i = 1; i < params.length; i++)
                {
                    if (i > 1) {
                        data += " " + params[i];
                    } else {
                        data += params[i];
                    }
                }

                //check the parameter

                //pull it apart to work with the indices
                data = data.split("");

                //there are 4 positions that we need to look at, and they can have many values for "
                var d1 = data[0];               //first
                var d2 = data[1];               //second
                var dz = data[data.length-1];   //last
                var dy = data[data.length-2];   //next to last

                //this goes a little haywire, quotes passed in from glados are different from those typed
                //and for some reason the typed ones are double quoted on both sides?!  weird.  this catches all cases, though.
                if (    (d1 === "\"" || d1 === "\u0010" || d1 === '"' && dz === "\"" || dz === "\u0010" || dz === '"')
                    ||  (d2 === "\"" || d2 === "\u0010" || d2 === '"' && dy === "\"" || dy === "\u0010" || dy === '"'))
                {
                    //put it back together for string replace operation
                    data = data.join("");

                    //strip out all the different incarnations of "
                    while (data.indexOf("\u0010") >= 0)
                    {
                        data = data.replace("\u0010","");
                    }
                    while (data.indexOf("\"") >= 0)
                    {
                        data = data.replace("\"","");
                    }

                    while (data.indexOf('"') >= 0)
                    {
                        data = data.replace('"',"")
                    }

                    //and go ahead and send the write operation to the kernel
                    krnWriteFile( [HDD_IRQ_CODES[5], params[0], data] );
                }
                else
                {
                    _StdIn.putLine('Incorrect arguments.  try: write <file> "<data>" - the quotes matter!');
                }
            }
            else
            {
                _StdIn.putLine('Incorrect arguments.  try: write <file> "<data>" - the quotes matter!');
            }


        };

        this.commandList[this.commandList.length] = sc;

        // read
        sc = new ShellCommand();
        sc.command = "read";
        sc.description = "- display <string1> file (from <string2> disk)";
        sc.function = function shellRead(params) {

            //was the minimum requirement of a filename given?
            if (params.length === 0)
            {   //when it's not, tell the user
                _StdIn.putLine("please specify a filename (and optional disk id.)");
            }
            //was a filename given without a disk id?
            else if (params.length ===1)
            {  //when it was, pad the parameters for the kernel routine with a null at index 2
                krnReadFile([HDD_IRQ_CODES[4],params[0], null]);
            }
            //otherwise, a full set of params was given
            else
            {   //so just pass them along to the driver
                krnReadFile([HDD_IRQ_CODES[4], params[0], params[1]]);
            }
        };

        this.commandList[this.commandList.length] = sc;

        // delete
        sc = new ShellCommand();
        sc.command = "delete";
        sc.description = "- Delete file <string1> file (from <string2> disk)";
        sc.function = function shellDelete(params) {

            //was the minimum requirement of a filename given?
            if (params.length === 0)
            {   //when it's not, tell the user
                _StdIn.putLine("please specify a filename (and optional disk id.)");
            }
            //was a filename given without a disk id?
            else if (params.length ===1)
            {  //when it was, pad the parameters for the kernel routine with a null at index 2
                krnDeleteFile([HDD_IRQ_CODES[2],params[0], null]);
            }
            //otherwise, a full set of params was given
            else
            {   //so just pass them along to the driver
                krnDeleteFile([HDD_IRQ_CODES[2], params[0], params[1]]);
            }
        };

        this.commandList[this.commandList.length] = sc;

        // List
        sc = new ShellCommand();
        sc.command = "ls";
        sc.description = "- List files (on disk ID '<string>')";
        sc.function = function shellList(params) {

            //was an argument supplied?
            if (params.length === 0)
            {   //when it's not, send the request without a disk id
                krnListFiles([HDD_IRQ_CODES[3],null]);
            }
            //was a filename given without a disk id?
            else if (params.length ===1)
            {  //when it was, send the request with a disk id
                krnListFiles([HDD_IRQ_CODES[3],params[0]]);
            }
        };

        this.commandList[this.commandList.length] = sc;

        // setSchedule
        sc = new ShellCommand();
        sc.command = "setschedule";
        sc.description = "- Sets the schedule to the specified string";
        sc.function = function shellSetSchedule(params) {
            if (params.length === 1)
            {
                if (SCHEDULER_ALGORITHMS.indexOf(params[0]) >= 0)
                {
                    switch (params[0])
                    {
                        case "fcfs":
                        {
                            _Quantum = Number.MAX_VALUE;
                        }
                            break;

                        case "rr":
                        {
                            _Quantum = 6;
                        }
                            break;

                        case "priority":
                        {
                            _Quantum = Number.MAX_VALUE;
                        }
                            break;

                        default:
                    }

                    CURRENT_SCHEDULER_ALGORITHM = SCHEDULER_ALGORITHMS[SCHEDULER_ALGORITHMS.indexOf(params[0])];
                    _StdOut.putLine("Changed schedule to : "+ CURRENT_SCHEDULER_ALGORITHM);
                }
                else
                {
                    _StdOut.putLine("Invalid scheduler type.  try 'fcfs', 'rr', or 'priority'");
                }
            }
        };

        this.commandList[this.commandList.length] = sc;

        // geSchedule
        sc = new ShellCommand();
        sc.command = "getschedule";
        sc.description = "- Displays the currently selected scheduling algorithm";
        sc.function = function shellGetSchedule() {
            _StdOut.putLine(CURRENT_SCHEDULER_ALGORITHM);
        };

        this.commandList[this.commandList.length] = sc;


        // Display the welcome message and initial prompt.
        _StdIn.putLine("Welcome to NOS - The turbocharged operating system!");
        this.putPrompt();
    };

    this.handleInput    =  function(buffer)
    {
        krnTrace("Shell Command~" + buffer);
        //
        // Parse the input...
        //
        var userCommand = new UserCommand();
        userCommand = shellParseInput(buffer);
        // ... and assign the command and args to local variables.
        var cmd = userCommand.command;
        var args = userCommand.args;
        //
        // Determine the command and execute it.
        //
        // JavaScript may not support associative arrays in all browsers so we have to
        // iterate over the command list in attempt to find a match.  TODO: Is there a better way? Probably.
        var index = 0;
        var found = false;
        while (!found && index < this.commandList.length)
        {
            if (this.commandList[index].command === cmd)
            {
                found = true;
                var fn = this.commandList[index].function;
            }
            else
            {
                ++index;
            }
        }
        if (found)
        {
            this.execute(fn, args);
        }
        else
        {
            // It's not found, so update for curses and apologies before declaring the command invalid.
            if (this.curses.indexOf("[" + rot13(cmd) + "]") >= 0)      // Check for curses.
            {
                this.execute(shellCurse);
            }
            else if (this.apologies.indexOf("[" + cmd + "]") >= 0)      // Check for apologies.
            {
                this.execute(shellApology);
            }
            else    // It's just a bad command.
            {
                this.execute(shellInvalidCommand);
            }
        }
    };

    this.execute        = function(fn, args)
    {
        // We just got a command, so advance the line...
        _StdIn.advanceLine();
        // ... call the command function passing in the args...
        fn(args);
        //Always advance the line, don't make the user programs or shell commands worry about it
        _StdIn.advanceLine();
        // ... and finally write the prompt again.
            this.putPrompt()
    };
}

//
// The rest of these functions ARE NOT part of the Shell "class" (prototype, more accurately), 
// as they are not denoted in the constructor.  The idea is that you cannot execute them from
// elsewhere as shell.xxx .  In a better world, and a more perfect JavaScript, we'd be
// able to make then private.  (Actually, we can. have a look at Crockford's stuff and Resig's JavaScript Ninja cook.)
//

//
// An "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function shellParseInput(buffer)    //called by this.handleInput
{
    var retVal = new UserCommand();

    // 1. Remove leading and trailing spaces.
    buffer = trim(buffer);

    // 2. Lower-case it.
    buffer = buffer.toLowerCase();

    // 3. Separate on spaces so we can determine the command and command-line args, if any.
    var tempList = buffer.split(" ");

    // 4. Take the first (zeroth) element and use that as the command.
    var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript.  See the Queue class.
    // 4.1 Remove any left-over spaces.
    cmd = trim(cmd);
    // 4.2 Record it in the return value.
    retVal.command = cmd;

    // 5. Now create the args array from what's left.
    for (var i in tempList)
    {
        var arg = trim(tempList[i]);
        if (arg != "")
        {
            retVal.args[retVal.args.length] = tempList[i];
        }
    }
    return retVal;
}

//
// An "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function ShellCommand()     
{
    // Properties
    this.command = "";
    this.description = "";
    this.function = "";
}

//
// Another "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function UserCommand()
{
    // Properties
    this.command = "";
    this.args = [];
}

//
// Shell Command Functions.  Again, not part of Shell() class per se', just called from there.
//
function shellInvalidCommand()
{
    _StdIn.putText("Invalid Command. ");
    if (_SarcasticMode)
    {
        _StdIn.putText("Duh. Go back to your Speak & Spell.");
    }
    else
    {
        _StdIn.putText("Type 'help' for, well... help.");
    }
}

function shellCurse()
{
    _StdIn.putText("Oh, so that's how it's going to be, eh? Fine.");
    _StdIn.advanceLine();
    _StdIn.putText("Bitch.");
    _SarcasticMode = true;
}

function shellApology()
{
   if (_SarcasticMode) {
      _StdIn.putText("Okay. I forgive you. This time.");
      _SarcasticMode = false;
   } else {
      _StdIn.putText("For what?");
   }
}

function shellVer(args)
{
    _StdIn.putText(APP_NAME + " version " + APP_VERSION);    
}

function shellHelp(args)
{
    _StdIn.putText("Commands:");
    for (var i in _OsShell.commandList)
    {
        _StdIn.advanceLine();
        _StdIn.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
    }    
}

function shellShutdown(args)
{
     _StdIn.putText("Shutting down...");
     // Call Kernel shutdown routine.
    krnShutdown();   
    // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
}

function shellCls(args)
{
    //TODO weird defect with prompt appearing twice when 'cls' entered at prompt
    _StdIn.clearScreen();
    _StdIn.resetXY();
    _OsShell.putPrompt();
}

function shellMan(args)
{
    if (args.length > 0)
    {
        var topic = args[0];
        switch (topic)
        {
            case "help": 
                _StdIn.putText("Help displays a list of (hopefully) valid commands.");
                break;
            default:
                _StdIn.putText("No manual entry for " + args[0] + ".");
        }        
    }
    else
    {
        _StdIn.putText("Usage: man <topic>  Please supply a topic.");
    }
}

function shellTrace(args)
{
    if (args.length > 0)
    {
        var setting = args[0];
        switch (setting)
        {
            case "on": 
                if (_Trace && _SarcasticMode)
                {
                    _StdIn.putText("Trace is already on, dumbass.");
                }
                else
                {
                    _Trace = true;
                    _StdIn.putText("Trace ON");
                }
                
                break;
            case "off": 
                _Trace = false;
                _StdIn.putText("Trace OFF");                
                break;                
            default:
                _StdIn.putText("Invalid arguement.  Usage: trace <on | off>.");
        }        
    }
    else
    {
        _StdIn.putText("Usage: trace <on | off>");
    }
}

function shellRot13(args)
{
    if (args.length > 0)
    {
        _StdIn.putText(args[0] + " = '" + rot13(args[0]) +"'");     // Requires Utils.js for rot13() function.
    }
    else
    {
        _StdIn.putText("Usage: rot13 <string>  Please supply a string.");
    }
}

function shellPrompt(args)
{
    if (args.length > 0)
    {
        _OsShell.promptStr = args[0];
    }
    else
    {
        _StdIn.putText("Usage: prompt <string>  Please supply a string.");
    }
}

//verify that a program contains valid characters contained in an opcode
function shellProgramValidation(args)
{
    return /[ABCDEF][ABCDEF]|[ABCDEF]\d|\d\d/g.test(args.toUpperCase());

}

//loop through pids to fin the index that corresponds to the given pid
//param = the pid you are looking for
//returns the index of the pid you're looking for.  Null if not found
function shellGetPidIndex(args)
{
    var retVal = null;
    //loop through all pid's to see of the paramter specified
    for (var i = 0; i < _ThreadList.length; i++)
    {   //Start by checking the pid of the PCB in the _ThreadList at index i
        if (_ThreadList[i].pid === parseInt(args[0]))
        {   //the pcb at _ThreadList[i] is the one we want to kill
            retVal = i;
        }
    }
    return retVal;
}

function shellVerifyFileName(filename)
{

    krnTrace(this + "Requested file operation, verifying file name");

    var retVal = true;

    //was a filename specified?
    if (filename)
    {   //if it was then we set the target filename

        //first make sure the filename is a string
        if (typeof filename === "string")
        {   //when we have a valid string argument, we need to look for invalid chars

            //first things first, is the string too long?
            if (filename.length > HDD_BLOCK_SIZE - FS_META_BITS)
            {   //filename is too long to fit in the fat table

                //so it's invalid
                retVal = false;

                //tell the user
                krnTrace(this + "Invalid file name: too long");
                _StdOut.putLine("File name is too long");
            }
            //when the length is ok, we need to check for invalid characters
            else
            {
                if(!_FS.isStringOK(filename))
                {
                    retVal = false;

                    krnTrace(this + "Invalid file name: Invalid characters")
                    _StdOut.putLine("File name contains invalid characters");
                }
            }

            //last, check for duplicate file name
            for (var i = 0; i < FS_FILENAMES.length; i++)
            {
                if (filename === FS_FILENAMES[i][1])
                {
                    retVal = false;

                    krnTrace(this + "Invalid file name: duplicate file name");
                    _StdOut.putLine("File name already exists");
                }
            }
            //by the time we get here, we know for sure if the filename is valid or not
        }
        //when the filename isn't a string, notify the user
        else
        {   //tell the user that they gave bad input for the filename
            krnTrace(this + "file creation failed, invalid argument: filename not a string");
            _StdOut.putLine("File name is not a string");
        }

    }
    else
    //filename was not given
    {   //tell the user that they forgot to give a filename argument
        krnTrace(this +"file creation failed, missing argument: filename");
        _StdOut.putLine("File name missing");
    }

    return retVal;
}
