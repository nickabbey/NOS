/* ------------
 mmu.js

 requires globals.js

 The memory management unit, allows access to main memory.  Provides logical address space

 ------------ */

function Mmu()
{

    //fields
    this.logicalMemory =
    {
        base        : 0,
        limit       : _InstalledMemory -1
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

            //refresh the displays
            updateDisplayTables();
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

    //TODO - For now, mmu.getNextPcbAddress() returns "00".  Will eventually return the start address for a pcb
    this.getNextPcbAddress = function()
    {
        return 0;
    };
}

//Memory addresses come in a pair, and they're in reverse order.
// IE 40 00 means 00 40, or technically the 64th slot in the 00th memory array
// returns the integer equivalent of a hex memory pair, to be used as an index for _MainMemory
function translateAddress()
{
    //comes first in memory
    var slot = parseInt(_MainMemory[_CurrentThread.pc + _CPU.PC], 16); //00 - FF
    //comes next in memory
    var bank = parseInt(_MainMemory[_CurrentThread.pc + _CPU.PC + 1], 16); // 0, 1, 2 corresponding to a memory bank

    //assigned, will stay null iff bank isn't 0, 1, 2
    var offset = null;  //distance of current memory address from main memory slot 0

    switch (bank)
    {
        case 0:
            offset = 0 + slot;  //bank 0
            break;
        case 1:
            offset = 255 + slot;  //bank 1
            break;
        case 2:
            offset = 511 + slot;  //bank 2
            break
        default:
            offset = null;
            break
    }

    //don't forget to advance _CPU PC so it doesn't read these memory address as opcodes on next fetch
    _CPU.PC += 2;  //TODO possible defect if this returns null and PC is not reset (shell.run SHOULD be setting PC to 0)

    //should only return: null, 0, 1, 2
    return offset;
}