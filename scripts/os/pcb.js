/*
 pcb.js

     Represents a process control block.

     fields can be accessed directly via dot notation, or getRegisters() can be used to mirror current CPU state
*/


function Pcb (state, pid, base, limit)
{
    // Member variables
    this.pid		= pid;  	// Process id
    this.state      = state;    // Process state
    this.pc         = 0;        // Program counters always start at 0
    this.base       = base;     // Address of pcb start (integer index for _MainMemory, -1 indicates process on disk)
    this.limit      = limit;    // Address of pcb end (integer index for _MainMemory, -1 indicates process on disk)
    this.location   = -1;     // -1 for on disk or 0-2 for a memory partition

    // Registers are members too
    this.acc = 0;
    this.x 	 = 0;
    this.y 	 = 0;
    this.z 	 = 0;

    //updates an instance of a PCB to contain the same register values as the CPU
    this.update = function()
    {
        this.acc = _CPU.Acc;
        this.x = _CPU.Xreg;
        this.y = _CPU.Yreg;
        this.z = _CPU.Zflag;
        this.pc = _CPU.PC;
    };

    this.setLocation = function(base, limit, partition)
    {
        this.base = base;
        this.limit = limit;
        this.location = partition;
    };
}