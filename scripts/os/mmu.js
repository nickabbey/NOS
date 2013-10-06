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
    this.load = function(args)
    {
        if (args === null || args.size === 0)
        {
            _StdOut.putLine("MMU load operation failed");
            return;
        }
        else
        {
            for(var i = 0; i < (args.length); i++)
            {
                _MainMemory[i] = args[i];
            }

            _MemoryTable.innerHTML = "";
            _MemoryTable.appendChild(memoryToTable());
            _StdOut.putLine("MMU load operation complete");
        }

    };
}