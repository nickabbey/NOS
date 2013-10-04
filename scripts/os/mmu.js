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

    this.write(hexVal, address)
    {
        _MainMemory[address] = hexval;
    }

    this.read(address)
    {
        return _MainMemory[address];
    }
}