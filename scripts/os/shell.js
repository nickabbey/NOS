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
            //get the user code
            var program = document.getElementById("taProgramInput").value;
            //format it
            program = trim(program.toUpperCase());
            _StdIn.putLine(program);
            if (shellProgramValidation(program))
            {
                _StdOut.putLine("Program is valid, loading...");
                var partition = _MMU.getFreePartition();
                if(partition === -1)
                {   //no free memory slots
                    krnTrace(this + "failed to load user program");
                    _StatusBar.value = "Memory is full, kill a process and try again";
                }
                else
                {   //We got memory, so we can load the thread
                    _ThreadList[_ThreadList.length] = new Pcb("LOADED", _NextPID, _MainMemory[_MMU.logical.tlb[partition][0]]);
                    _MMU.logical.freeParts[partition] = false;
                }

                //tokenize program input
                var opCodes = program.split(" ");

                //TODO - modify for logical memory
                _MMU.load(opCodes);


                _StdOut.putLine("Program loaded with PID: " + _NextPID);
                //update PID and the last tlb address
                _NextPID++;
                //TODO - This needs to change for later projects
                _CurrentThread = _ThreadList[0];
            }
            else
            {
                _StdOut.putLine("Program is invalid");
            }
        };

        this.commandList[this.commandList.length] = sc;

        // Run
        //TODO - later revisions of run will require a PID parameter
        sc = new ShellCommand();
        sc.command = "run";
        sc.description = "- Run a user program";
        sc.function = function shellRunProgram() {
            //action and output based on successfully loaded thread
            if(_CurrentThread)
            {
                _StdIn.putText("Executing user PID " + _CurrentThread.pid);
                _StdIn.advanceLine();
                //reset CPU PC
                _CPU.PC = 0;

                //set CPU execution based on whether or not stepping is enabled
                (_StepStatus) ? _CPU.isExecuting = false : _CPU.isExecuting = true;

                //set the thread state based on _CPU execution status
                (_CPU.isExecuting) ? _CurrentThread.state = "RUNNING" : _CurrentThread.state = "SUSPENDED";
            }
            else
            {
                _StdIn.putLine("Unable to Run, nothing loaded");
                krnTrace(this + " executed bad run (no process loaded)");
            }
            //update the pcb display to reflect initial state
            updateDisplayTables();
        };

        this.commandList[this.commandList.length] = sc;

        // Step
        //TODO - later revisions of run will require a PID parameter
        sc = new ShellCommand();
        sc.command = "step";
        sc.description = "- enable single step operation for a process";
        sc.function = function shellStep() {
            //simulate the action of checking/unchecking the single step box
            document.getElementById('chkStep').checked = !(document.getElementById('chkStep').checked);
            //call the host routine that does the actual work
            hostChkStep();
        };

        this.commandList[this.commandList.length] = sc;



        // processes - list the running processes and their IDs
        // kill <id> - kills the specified process id.

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
            // It's not found, so check for curses and apologies before declaring the command invalid.
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
    //TODO werid defect with prompt appearing twice when 'cls' entered at prompt
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

////do the actual work to move the user program in to tlb
//function shellProgramLoader(args)
//{
//    var opCodes = args.split(" ");
//    for (i = 0; i < opCodes.size - 1; i++)
//    {
//        _MMU.load()
//    }
//}
