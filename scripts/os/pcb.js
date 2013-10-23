/*
 pcb.js

     Represents a process control block.

     fields can be accessed directly via dot notation, or getRegisters() can be used to mirror current CPU state
*/


function Pcb (state, pid, pc)
{
    // Member variables
    this.pid		= pid;  	// Process id
    this.state      = state;    // Process state
    this.pc         = pc;       // Program counter - entry point for the program in tlb

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
    };
}