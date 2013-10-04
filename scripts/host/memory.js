/* ------------  
 Memory.js

 Implementation of main memory

 returns an array length 768, initialized to "00"
 ------------ */

function Memory()
{
    //memory cells
    this.bank = [];

    //initilalize them all to "00"
    for(i=0; i < _InstalledMemory; i++)
    {
        this.bank[i] = "00";
    }
    //Constructor returns the initialized array
    return this.bank;
}