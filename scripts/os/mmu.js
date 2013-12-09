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
            partitionMap    :   [], //2D array, translates logical to physical addresses
            numParts        :   0,  //set by init
            freeParts       :   []  // set by init - freeParts[n] returns boolean true only if partition n is free
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
        if (opCodes)
        {   //opcodes were passed in, move them to memory

            for(var i = 0; i < (opCodes.length); i++)
            {
                this.physical[this.logical.partitionMap[partition][i]] = opCodes[i];
            }

            //refresh the displays
            updateDisplayTables();
        }
        else
        {   //no opcodes, let the user know
            _StdOut.putLine("MMU load operation failed");
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

    this.rollOut = function(pcb, data)
    {
        var retVal = false;
        krnTrace(this + "Begin rolling out PID: " + pcb.pid);

        //make the swap file name - note this bypasses the shellCreate which allows usage of invalid char "@" in name
        var swapFileName = this.makeSwapId(pcb.pid);
        var swapFileData = [];

        //data is supplied when rollin calls this for a new process
        if (data)
        {
            swapFileData = data;
        }
        //data is not supplied when rollin was reading from a swap file
        else
        {
            //write the memory partition to disk
            for(var i = 0; i < _MemorySegmentSize; i++)
            {
                swapFileData[swapFileData.length] = this.physical[this.logical.partitionMap[pcb.location][i]];
            }
        }

        swapFileData = swapFileData.join(" ");

        var goodName = krnCreateFile([HDD_IRQ_CODES[1],swapFileName, FS_ACTIVE_HDD]);
        var goodContent = krnWriteFile([HDD_IRQ_CODES[5], swapFileName, swapFileData]);

        if (goodName && goodContent)
        {
            //technically, this should always be true, but having this guard is somehow reassuring
            if(pcb.location != -1)
            {
                _MMU.logical.freeParts[pcb.location] = true;
                _MMU.flushPartition(pcb.location);
            }

            pcb.state = "ON DISK";
            pcb.setLocation(-1,-1,-1);

            krnTrace(this + "Done rolling out PID: " + pcb.pid);
            _StdOut.putLine("PID " + pcb.pid + " Rolled out");
            retVal = true;
        }
        return retVal;
    };

    this.rollIn = function(pcb, data)
    {
        var retVal = true;

        //ask the mmu where it should go
        var partition = _MMU.getFreePartition();

        //if the mmu doesn't have a free partition, the free one up
        if(partition === -1)
        {   //no free memory slots

            krnTrace(this + "Attempted to load process while memory was full");

            //when called from a context switch, there is a current thread
            if(_CurrentThread)
            {
                _StdIn.putLine("Memory is full, rolling process " + _CurrentThread.pid + " out to swap");
                retVal = _MMU.rollOut(_CurrentThread);
                if (!retVal)
                {
                    return retVal;
                }
            }
            //when called from shellLoad, there isn't a current thread, but there is data
            else
            {
                _StdIn.putLine("Memory is full, process data out to swap.");
                retVal = _MMU.rollOut(pcb, data);
                //when we were called from shellLoad, there's nothing left to do
                if(_ThreadList.indexOf(pcb) === -1)
                {
                    _ThreadList[_ThreadList.length] = pcb;
                }
                return retVal;
            }

        }

        //we only get here when we were called by a context switch and have memory in to which we may roll a thread

        //threads rolled in via shell load will use this, but not context switches
        if(_ThreadList.indexOf(pcb) === -1)
        {
            _ThreadList[_ThreadList.length] = pcb;
        }

        //Start by getting pointers to main memory
        var start = _MMU.getPartitionBegin(partition);
        var end = _MMU.getPartitionEnd(partition);

        //data is passed in from load
        if(data)
        {
            //load opcodes to the appropriate partition
            _MMU.load(data, partition);
        }
        //data is loaded from swap when called by context switch
        else
        {
            //then get the swap file name
            var swapFileName = this.makeSwapId(pcb.pid);


            //then get the data to be loaded
            var swapFileData = _FS.readFile(swapFileName).split(" ");

            //load opcodes to the appropriate partition
            _MMU.load(swapFileData, partition);
        }

        //Then update the PCB
        pcb.setLocation(start, end, partition);
        pcb.state = "READY";

        //update the free partition table
        _MMU.logical.freeParts[partition] = false;

        //and give some feedback
        krnTrace(this + "Rolled in PID: " + pcb.pid);
        _StdIn.putLine("Rolled in PID: " + pcb.pid);

        return retVal;
    };

    this.makeSwapId = function(pid)
    {
        return _FS.sysFileMarker + pid;
    };


}