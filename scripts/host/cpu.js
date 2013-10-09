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
        //TODO - some kind of error checking on addy, something like an if(addy)? this.fetch(): krnTrapError("Error");
        //or something more graceful than a krnTrapError, which will result in a bsod - maybe treat it like a sysbreak

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

            case "6D":
                    //TODO - Implement opcode 6D
                break;

            case "A2":
                    //TODO - Implement opcode A2
                break;

            case "AE":
                    //TODO - Implement opcode AE
                break;

            case "A0":
                    //TODO - Implement opcode A0
                break;

            case "AC":
                    //TODO - Implement opcode AC
                break;

            case "EA":
                    //TODO - Implement opcode EA

            // A "sysBreak" or "NoOp" when interpreted as an opcode, which it SHOULD be when executing a Cpu.fetch()
            case "00":
                this.sysBreak();
                break;

            case "EC":
                    //TODO - Implement opcode EC
                break;

            case "D0":
                    //TODO - Implement opcode D0
                break;

            case "EE":
                    //TODO - Implement opcode EE
                break;

            case "FF":
                    //TODO - Implement opcode FF
                break;

            default:
                this.sysBreak();
                break;
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

        this.reset();
    };
}
