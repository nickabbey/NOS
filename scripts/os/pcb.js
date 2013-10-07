

function Pcb (state, pid, pc)
{
    // Member variables
    this.pid		= pid;  	// Process id
    this.state      = state;    // Process state
    this.pc         = pc;       // Program counter - entry point for the program in memory

    // Registers
    this.acc = 0;
    this.x 	 = 0;
    this.y 	 = 0;
    this.z 	 = 0;

    // Facility to change/update values of our PCB
    this.update = function(state, pc, acc, x, y, z)
    {
        this.state = state;
        this.pc	   = pc;
        this.acc   = acc;
        this.x     = x;
        this.y     = y;
        this.z     = z;
    };
}