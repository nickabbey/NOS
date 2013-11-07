/* ------------
 mmu.js

 requires globals.js

 The memory management unit.  Only the CPU should be accessing main memory directly. Any other part of the
 OS that needs access to memory (Notably, shell) should use MMU.logical and related methods for memory access.

  IE) shell.js load should be using the mmu, as should pcb.js

 ------------ */

function Mmu()
{

    //fields

    //TODO - control ensures that this won't be null but prob a good idea to update in case that fails or changes
    this.physical = _MainMemory;

    //the logical memory of the system
    this.logical =
        {
            partitionMap     :   [], //2d array, translates logical to physical addresses
            numParts    :   0,  //set by init
            freeParts   :   []  // set by init - freeParts[n] returns boolean true only if partition n is free
        };

    //initializes the logical memory
    //TODO - something better than a kernel trap if this fails - kernel panic mode?
    this.init = function()
    {
        //make sure your segments will fit in your system memory
        if (_InstalledMemory % _MemorySegmentSize === 0 )
            {
                //Determine how many partitions there will be
                this.logical.numParts = _InstalledMemory / _MemorySegmentSize;

                //initialize the partitionMap
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

    //creates logical partitions and maps offset addresses to physical addresses using this.logical.partitionMap
    //stores a memory map in this.logical.partitionMap in the format:
    //partition 1 offset 0 === this.logical.partitionMap[1][0] === _MainMemory[256]
    //parameter p is the number of partitions to be created
    this.partition = function(p)
    {
        for(var i = 0; i < p; i++)
        {   //i is now the logical partition id, and accessed as this.logical.partitionMap[i]

            //initialize the partition with an empty array
            this.logical.partitionMap[this.logical.partitionMap.length] = [];

            //initialize the translation table
            for (var j = 0; j < _MemorySegmentSize; j++)
            {   //j is now the offset index for partition i

                //an array index for _MainMemory
                var pointer = _MemorySegmentSize * (i) + j;
                //fill in the pointer value
                this.logical.partitionMap[i][j] = pointer;
            }
        }
    };

    //load a program from the user program input section in to memory
    //argument should be an array of strings length 2 representing opcodes
    //load command should ensure that this requirement is met
    this.load = function(opCodes, partition)
    {
        //make sure there are opcodes to load
        if (opCodes === null || opCodes.size === 0)
        {
            _StdOut.putLine("MMU load operation failed");
        }
        else  //opcodes were passed in, move them to memory
        {
            for(var i = 0; i < (opCodes.length); i++)
            {
                this.physical[this.logical.partitionMap[partition][i]] = opCodes[i];
            }

            //refresh the displays
            updateDisplayTables();
        }

    };

    //returns the partition id of the first available partition
    this.getFreePartition = function()
    {
        //get first free partition
        return this.logical.freeParts.indexOf(true);
    };

    //takes a partition id, returns an integer index for _MainMemory, or null if the partition doesn't exist
    this.getPartitionBegin = function(p)
    {
        //initialize return to null
        var retVal = null;

        if (this.logical.partitionMap[p])
        {   //p is a valid logical partition
            retVal = this.logical.partitionMap[p][0];
        }

        //either null or a index to _MainMemory
        return retVal;
    };

    //takes a partion id, returns an integer index for _MainMemory, or null if the partition doesn't exist
    this.getPartitionEnd = function(p)
    {
        //initialize return to null
        var retVal = null;

        //if p is valid, return its end address
        if (this.logical.partitionMap[p])
        {
            retVal = this.logical.partitionMap[p][_MemorySegmentSize - 1];
        }

        //either null or a index to _MainMemory
        return retVal;
    };

    //flushes the memory in a partition p (resets all values to 00)
    this.flushPartition = function(p)
    {
        //verify its a valid partition
        if (this.logical.partitionMap[p])
        {   //if so, loop through and zero out the memory

            var offset = this.getPartitionBegin(p);
            for (var i = 0; i < this.logical.partitionMap[p].length -1; i++)
            {
                _MainMemory[offset + i] = "00";
            }

            //and mark the flushed partition free
            this.logical.freeParts[p] = true;
        }
        else
        {   //something went wrong, log it
            krnTrace(this + "failed to flush partition " + parseInt(p));
        }
    };
}