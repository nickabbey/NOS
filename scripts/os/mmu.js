/* ------------
 mmu.js

 requires globals.js

 The memory management unit, allows access to main memory.  Provides logical address space

 ------------ */

function Mmu()
{

    //Methods
    this.logicalMemorySpace =
    {
        base  : 0,
        limit : _InstalledMemory -1
    };

    //load a program from the user program input seciton in to memory
    //argument should be an array of strings length 2 representing opcodes
    //load command should ensure that this requirement is met
    this.load = function(args)
    {
        //make sure there are opcodes to load
        if (args === null || args.size === 0)
        {
            _StdOut.putLine("MMU load operation failed");
            return;
        }
        else  //opcodes were passed in, move them to memory
        {
            for(var i = 0; i < (args.length); i++)
            {
                _MainMemory[i] = args[i];
            }

            //refresh the memory display
            _MemoryTable.innerHTML = "";
            _MemoryTable.appendChild(memoryToTable());
            _StdOut.putLine("MMU load operation complete");
        }

    };

    //parameters are an opcode and a memory address
    this.write = function(args)
    {
        var opCode = null;
        var address = null;
        if (args != null)
        {
            opCode = args[0];
            address = args[1];
            _MainMemory[address] = opCode;
        }
    };

    //if a valid address is given, then return the contents of that address.
    //otherwise, return "00" (break code)
    this.read = function(args)
    {
        //TODO change _MMU.read to return something better than "00" if not given a valid address
        var retVal = formatMemoryAddress("0");
        var address = null;
        if (args !=null)
        {
            retVal = formatMemoryAddress(_MainMemory[address]);
        }
        return retVal;
    };

    //TODO - For now, mmu.getNextBlock() returns "00" but project 3 will need to be smarter
    this.getNextBlock = function()
    {
        return 0;
    };

}