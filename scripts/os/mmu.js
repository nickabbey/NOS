/* ------------
 mmu.js

 requires globals.js

 The memory management unit, allows access to main memory.  Provides logical address space

 ------------ */

function Mmu()
{

    //fields

    //TODO - control ensures that this won't be null but prob a good idea to check in case that fails or changes
    this.physical = _MainMemory;

    //the logical memory of the system
    this.logical =
        {
            tlb         :   [], //2d array, translates logical to physical addresses
            numParts    :   0,  //set by init
            freeParts   :   []  // set by init - freeParts[n] returns boolean true only if partition n is free
        };

    //initializes the logical tlb
    //TODO - something better than a kernel trap if this fails - kernel panic mode?
    this.init = function()
    {
        //make sure your segments will fit in your tlb
        if (_InstalledMemory % _MemorySegmentSize === 0 )
            {
                //Determine how many partitions there will be
                this.logical.numParts = _InstalledMemory / _MemorySegmentSize

                //partition the tlb
                this.partition(this.logical.numParts);

                //set them all free
                for (var p = 0; p < this.logical.numParts; p++)
                {
                    this.logical.freeParts[p] = true;
                }
            }
            else
            {   //freak out
                _StatusBar.value = "_InstalledMemory % _MemorySegmentSize != 0";
                krnTrapError("MEMORY INITIALIZATION FAILED!");
            }
    };

    //creates logical partitions and maps offset addresses to physical addresses
    //parameter p is the number of partitions to be created
    this.partition = function(p)
    {
        for(var i = 0; i < p; i++)
        {   //i is now the logical tlb partition id, and accessed as this.logical[i]

            //initialize the partition with an empty array
            this.logical.tlb[this.logical.tlb.length] = [];

            //initialize the translation table
            for (var j = 0; j < _MemorySegmentSize; j++)
            {   //j is now the offset index for partition i

                //an array index for _MainMemory
                var pointer = _MemorySegmentSize * (i) + j;
                //fill in the pointer value
                this.logical.tlb[i][j] = pointer;
            }
        }
        //this.logical[i][j] is an analog of a tlb.  partition 1 offset 0 === this.logical[1][0] === _MainMemory[256]
    };

    //load a program from the user program input section in to tlb
    //argument should be an array of strings length 2 representing opcodes
    //load command should ensure that this requirement is met
    //TODO - Modify this to use the tlb
    this.load = function(opCodes, partition)
    {
        //make sure there are opcodes to load
        if (opCodes === null || opCodes.size === 0)
        {
            _StdOut.putLine("MMU load operation failed");
            return;
        }
        else  //opcodes were passed in, move them to tlb
        {
            for(var i = 0; i < (opCodes.length); i++)
            {
                this.physical[this.logical.tlb[partition][i]] = opCodes[i];
            }

            //refresh the displays
            updateDisplayTables();
        }

    };

    //parameters are an opcode and a tlb address
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

    //returns the partition id of the first available partition
    this.getFreePartition = function()
    {
        //get first free partition
        return this.logical.freeParts.indexOf(true);
    };
}

//Memory addresses come in a pair, and they're in reverse order.
// IE 40 00 means 00 40, or technically the 64th slot in the 00th tlb array
// returns the integer equivalent of a hex tlb pair, to be used as an index for _MainMemory
function translateAddress(args)
{
    //initialize a return value
    var retVal = null;

    if(!args) //called with no arguments, translate the next address in main tlb
    {
        //comes first in tlb
        var slot = parseInt(_MainMemory[_CurrentThread.pc + _CPU.PC], 16); //00 - FF
        //comes next in tlb
        var bank = parseInt(_MainMemory[_CurrentThread.pc + _CPU.PC + 1], 16); // 0, 1, 2 corresponding to a tlb cells

        //assigned, will stay null iff cells isn't 0, 1, 2
        var offset = null;  //distance of current tlb address from main tlb slot 0

        switch (bank)
        {
            case 0:
                offset = 0 + slot;  //cells 0
                break;
            case 1:
                offset = 255 + slot;  //cells 1
                break;
            case 2:
                offset = 511 + slot;  //cells 2
                break
            default:
                offset = null;
                break
        }

        //don't forget to advance _CPU PC so it doesn't read these tlb address as opcodes on next fetch
        _CPU.PC += 2;  //TODO possible defect if this returns null and PC is not reset (shell.run SHOULD be setting PC to 0)

        //should only return: null, 0, 1, 2
        retVal = offset;
    }
    // arguments were given in the form of a string (IE: from the Y register on a system call), so translate them
    else if (typeof args === 'string')
    {
        //there's a discrepancy here, in that tlb addresses should be a pair, but the y register only holds 1 value
        //for now, we assume the strings will be stored in valid addresses between 00 and FF.
        retVal = parseInt(args, 16)
    }

    return retVal;
}