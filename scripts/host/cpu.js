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
    
    this.cycle = function()
    {
        krnTrace("CPU cycle");
        // TODO: Accumulate CPU usage and profiling statistics here.
        // Do the real work here. Be sure to set this.isExecuting appropriately.

        //fetch and execute the next opcode
        this.execute(this.fetch());

        //refresh CPU display
        _CpuTable.innerHTML = "";
        _CpuTable.appendChild(cpuToTable());

        //if single step is enabled, turn off execution until step is clicked
        if(_StepStatus)
        {
            this.isExecuting = false;
        }
    };

    this.execute = function(opCode)
    {
        ++this.PC;
        switch(opCode.toUpperCase())
        {
            //load accumulator with a constant
            case "A9":
                this.Acc = this.fetch();
                break;

            case "AD":
                //advance PC so that next fetch gives address of memory to be loaded in to the Acc
                ++this.PC;
                this.Acc = _MainMemory[translateAddress(this.fetch())];
                break;

            case "8D":
                    //TODO - Implement opcode 8D
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

            case "00":
                    this.isExecuting = false;
                    _CurrentThread.state = "TERMINATED";
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
                //same as "00" operation.  That is, it's a "sysbreak"
                this.isExecuting = false;
                _CurrentThread.state = "TERMINATED";
                break;
        }
    };

    //return the next opcode as a hex code
    this.fetch = function()
    {
        //next op is located at the program's starting address + CPU's PC
        var entryPoint = _CurrentThread.pc + this.PC;
        var retVal = _MainMemory[entryPoint];
        return retVal;
    };
}
