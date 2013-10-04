/* ------------
 mmu.js

 The memory management unit, allows access to main memory.  Provides logical address space

 ------------ */

function Mmu()
{
    this.logicalMemorySpace =
    {
        base  : 0,
        limit : _InstalledMemory -1
    };

    this.load = function(args)
    {
        if (args == null)
        {
            _StdOut.putText("MMU load operation failed");
            return;
        }
        else
        {
            var program = args[0];

            for(i == 0; i < program.size -1; i++)
            {
                _MainMemory[base + i] = program[i];
            }
            memoryToTable();
            _StdOut.putText("MMU load operation complete");
        }

    };
}