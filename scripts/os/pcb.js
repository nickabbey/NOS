

function Pcb (state, pid, pc, base, limit, slot, priority)
{
    // Member variables
    this.pid		= pid;  	// Process id
    this.state      = state;    //Process state

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