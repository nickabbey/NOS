/* ------------  
   CPU.js

   Requires global.js.
   
   Routines for the host CPU simulation, NOT for the OS itself.  
   In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
   that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
   JavaScript in both the host and client environments.

   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

function Cpu()
{
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
    this.isExecuting = false;
    
    this.init = function()
    {
        this.PC    = 0;
        this.Acc   = 0;
        this.Xreg  = 0;
        this.Yreg  = 0;
        this.Zflag = 0;      
        this.isExecuting = false;  
    };

    //Reset CPU values to initial state
    this.reset = function()
    {
        this.PC    = 0;     // Program Counter
        this.Acc   = 0;     // Accumulator
        this.Xreg  = 0;     // X register
        this.Yreg  = 0;     // Y register
        this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
        this.isExecuting = false;
    };
    
    this.cycle = function()
    {
        // TODO: Accumulate CPU usage and profiling statistics here.
        // Do the real work here. Be sure to set this.isExecuting appropriately.

        //if single step is in and the cpu is executing operations
        if(_StepStatus && this.isExecuting)
        {
            //fetch and execute your next opcode
            this.execute(this.fetch()); //advances PC by 1
            //set executing to false and update the current process state (reversed in Control.hostBtnStepClick())
            this.isExecuting = false;
            //if the last op was a sysbreak, then _CurrentThread will be null
            (_CurrentThread)? _CurrentThread.state = "SUSPENDED": krnTrace("No current thread");
            krnTrace("CPU cycle completed. Next execution deferred.");
        }
        //otherwise single step is off, and there are no real concerns
        else if (!_StepStatus && this.isExecuting)
        {
            //fetch and execute the next opcode
            this.execute(this.fetch()); //advances PC by 1
            krnTrace("CPU cycle completed.  Next execute on cycle.");
        }
    };

    this.execute = function(opCode)
    {
        //reused by any opcodes that need access to _MainMemory, to be set by translateAddress()
        var addy = null;

        //TODO - some kind of error checking on addy within the opcode cases.
        //something like an if(addy)? this.fetch(): krnTrapError("Error");
        //or something more graceful than a krnTrapError, which will result in a bsod - maybe treat it like a sysbreak?

        //Make sure we have a good opcode, otherwise let the user know
        if(!opCode)
        {   //TODO - recover from this more gracefully
            krnTrace(this + "Something went wrong while the CPU was executing an opCode!");
        }
        //Otherwise, it's a gravy train with biscuit wheels, baby!
        else
        { //process the opcode
            switch(opCode.toUpperCase()) // should already be uppercase, but just to be safe
            {
                //load accumulator with a constant
                case "A9":
                    this.Acc = this.fetch();  //advances the PC by 1
                    break;

                //load accumulator with a value from memory
                case "AD":
                    addy = translateAddress();  //advances the PC by 2
                    this.Acc = _MainMemory[addy];
                    break;

                //store the accumulator in memory
                case "8D":
                    addy = translateAddress();  //advances the PC by 2
                    _MainMemory[addy] = this.Acc;
                    break;

                //Add with carry (store result of acc + value at memory address in acc)
                case "6D":
                    addy = translateAddress();
                    //          (acc hex to int         + hex at memory address to int) as hex
                    this.Acc = (parseInt(this.Acc, 16) + parseInt(_MainMemory[addy], 16)).toString(16);
                    break;

                //load x register with constant
                case "A2":
                    this.Xreg = this.fetch();  //advances the PC by 1
                    break;

                //load x register from memory
                case "AE":
                    addy = translateAddress();  //advances the PC by 2
                    this.Xreg = _MainMemory[addy];
                    break;

                //load y register with constant
                case "A0":
                    this.Yreg = this.fetch();  //advances the PC by 1
                    break;

                //load y register from memory
                case "AC":
                    addy = translateAddress();  //advances the PC by 2
                    this.Yreg = _MainMemory[addy];
                    break;

                case "EA":
                    //no actual operation, advance the PC to move past this operation
                    ++this.PC;

                // Break
                case "00":
                    this.sysBreak();
                    break;

                //compare x (zflag true if value at memory address = value in x reg, false otherwise)
                case "EC":
                    addy = translateAddress();  // advances the pc by 2
                    // if integer value of memory at addy === integer value of the x register, z = 1.  Else, z = 0
                    //why doesn't this work? syntax?
                    //this.Zflag = (parseInt(_MainMemory[addy], 16) === parseInt(this.Xreg)) ? 1 : 0;
                    if(parseInt(_MainMemory[addy], 16) === parseInt(this.Xreg))
                    {
                        this.Zflag = 1;
                    }
                    else
                    {
                        this.Zflag = 0;
                    }
                    break;

                //branch ahead (if z flag = 0, increment PC by byte value specified in next slot
                case "D0":
                    //the z flag check
                    if( this.Zflag === 0 )
                    {   // you need to branch, so figure out how far to increment pc
                        var branchIncrement = parseInt(this.fetch(), 16);

                        //make sure you haven't been asked to branch past the end of memory
                        if( this.PC + branchIncrement > _InstalledMemory - 1)
                        //You did exceed max memory address, inform the user and wrap around
                        {
                            krnTrace("CPU Branch error (destination address out of bounds)");
                            //alert("You've branched beyond the end of memory.  I've wrapped the PC, but this could be bad.  'Try to imagine all life as you know it stopping instantaneously and every molecule in your body exploding at the speed of light.', bad.");
                            this.PC =  (this.PC + branchIncrement) % _InstalledMemory;
                            //TODO - should this do something more reliable?  halt the operation, reset the displays and inform the user, perhaps?
                        }
                        //your branch value is acceptable, so just branch as requested
                        else
                        {
                            this.PC += branchIncrement;
                        }
                    }
                    //the z flag check failed, so there's no branch
                    else
                    {
                        //and all we need to do is throw away the op and increment the PC by 1 to move past it
                        this.fetch();
                    }
                    break;

                //increment value at a memory address by 1 (wrap ff to 00)
                case "EE":
                    addy = translateAddress();
                    //TODO - is wrapping form 255 to 00 on an increment really the best idea?
                    //why didn't it like this syntax?
//                    _MainMemory[addy] = (_MainMemory[addy] === "FF")?
//                        _MainMemory[addy] = "00" :
//                        _MainMemory[addy] = formatMemoryAddress(((parseInt(_MainMemory[addy], 16)) + 1).toString(16)) ;
                    if(_MainMemory[addy] === "FF")
                    {
                        _MainMemory[addy] = "00";
                    }
                    else
                    //convert hex val at _MainMemory[addy] to int.  Add 1 to it and convert back to hex
                    {
                        var base = parseInt(_MainMemory[addy], 16);
                        _MainMemory[addy] = formatMemoryAddress((base + 1).toString(16));
                    }
                    break;

                //system call - print contents of y register, format based on x register (x=1 print integer, x=2 print string terminated by "00")
                case "FF":
                    // check the easy case first, where we are printing an integer value:
                    if( parseInt(this.Xreg, 16) === 1)
                    {
                        //parse the y register as a hex number, print its decimal value
                        _StdIn.putText(parseInt(this.Yreg, 16).toString(10));
                    }
                    //	check the harder case second, where we must construct and display a "00" terminated character string
                    else if( parseInt(this.Xreg) === 2)
                    {
                        //store the current PC
                        var returnAddy = this.PC;

                        //set the PC to the start address given by the Y register, so we can fetch the string
                        this.PC = translateAddress(this.Yreg);

                        // for loop control
                        var nextCode = this.fetch();
                        //initialize nextChar as blank string
                        var nextChar = "";
                        //initialize output as empty string
                        var output = nextChar;
                        //loop until an "00" is fetched
                        while(nextCode != "00")
                        {
                            //will append all but the "00" character to the string, while advancing the PC appropriately
                            nextChar = String.fromCharCode(parseInt(nextCode, 16));
                            output += nextChar;
                            nextCode = this.fetch();
                        }

                        _StdIn.putText(output);

                        //return PC to position of memory call (don't need to increment PC, next cycle fetch does it)
                        this.PC = returnAddy;

                    }
                    break;

                default:
                    this.sysBreak();
                    break;
            }
        }
    };

    // returns the next opcode as a hex string and advances the CPU PC
    // *NOTE* - Use _MMU.translateAddress() to retrieve memory addresses in opcodes that need memory access
    this.fetch = function()
    {
        //next op is located at the program's starting address + CPU's PC
        var entryPoint = _CurrentThread.pc + this.PC;
        //advance the PC for next fetch or translateAddress()
        ++_CPU.PC;
        return _MainMemory[entryPoint];
    };

    //"00" as an opCode is a sysBreak.  It represents the end of a user program
    //"00" can also be part of a memory address or a string terminator, but sysBreak is only called when it's an opCode
    this.sysBreak = function()
    {
        //Stop operation of the CPU
        this.isExecuting = false;

        //update the current thread PCB before terminating
        _CurrentThread.update();

        //Tell the thread it's terminated
        _CurrentThread.state = "TERMINATED";

        //keep track of thread final state (for project2 req's, but any additional value beyond this assignment?)
        _LastPCB = _ThreadList[0];

        // kernel only executes a cycle when there is a thread, setting it null is analogous to having an empty ready queue
        _CurrentThread = null;

        //reset the status bar, if needed
        _StatusBar.value = "Nothing to see here.  Move along.  Load and run a program, or something.";

        this.reset();
        _StdIn.advanceLine();
        _OsShell.putPrompt();
    };
}
