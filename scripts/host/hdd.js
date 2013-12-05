/**
 * User: nick
 *
 *  Requires:  global.js
 *
 *      Hdd.js
 *
 *      Represents a virtual hard disk drive comprised of 4 tracks, 8 sectors, 8 blocks (64 b/block)
 *      this.spindle is a reference to localStorage containing keys for all blocks on the disk
 *      This file provides the raw virtual device and lowest level operations for modifying block contents.
 *      The driver provides an API to these low level routines.
 *      The file system describes how the data is represented on the disk.
 *      The kernel makes API calls based on commands received via the shell.
 */


//Constructor
function Hdd()
{
    //fields
    this.spindle    = sessionStorage;   //a reference to local storage
    this.tracks     = HDD_NUM_TRACKS;   //0-3
    this.secotrs    = HDD_NUM_SECTORS;  //0-7
    this.blocks     = HDD_NUM_BLOCKS;   //0-7
    this.blockSize  = HDD_BLOCK_SIZE;   //0-63
    this.rawData    = "~";             //represents an uninitialized block

    //methods

    //"Spin up" a blank, unformatted hard drive for the virtual host system
    this.init = function()
    {
        var key = "";
        var data = this.initFileBlock();
        var value = this.processFileBlock(data);

        //build tracks
        for (var t=0; t < this.tracks; t++)
        {
            //build sectors within tracks
            for (var s=0; s < this.secotrs; s++)
            {
                //build blocks withing sectors
                for (var b=0; b < this.blocks; b++)
                {
                    //update the key
                    key = t.toString() + "." + s.toString() + "." + b.toString();
                    //initialize the blocks for this key
                    this.spindle.setItem(key, value);
                }
            }
        }

    };

    //Creates the "physical" blocks.  Notes that these are "raw" unformatted blocks.
    //a hard drive's initial state is "raw" or unformatted blocks, symbolized by "~~"
    this.initFileBlock = function()
    {
        //the base array, will grow to size this.blocksize to represent an unformatted block
        var val = [];

        for (var i = 0; i < (this.blockSize); i++)
        {
            val.push(this.rawData);
        }

        return val;
    };

    //turns an array of strings in to a "." delimited string that can be used as an HTML5 value
    //param is an array of strings
    this.processFileBlock = function(param)
    {
        var str = "";
        for (var i = 0; i < param.length; i++)
        {
            str = str.concat(param[i] + ".");
        }
        //remove the trailing "."
        str = str.slice(0, - 1);

        return str;
    };

    //Write out a block of data to the spindle
    //param[0] = spindle key ("t.s.b"), param[1] = data at key
    //NOTE - NO error checking here because the hardware needs to be FAST.  Let the driver handle error checking
    this.writeBlock = function(address, data)
    {   //"overwrite" blocks

        this.spindle.setItem(address, data);
    };

    //returns the entire block at the address specified
    this.readBlock = function(address)
    {
        return this.spindle.getItem(address);
    };
}
