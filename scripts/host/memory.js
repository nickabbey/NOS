/* ------------  
 Memory.js

 Implementation of main memory

 returns an array length 768, initialized to "00"
 ------------ */

function Memory()
{
    //tlb cells
    this.cells = [];

    //initilalize them all to "00"
    for(i=0; i < _InstalledMemory; i++)
    {
        this.cells[i] = "00";
    }
    //Constructor returns the initialized array
    return this.cells;
}