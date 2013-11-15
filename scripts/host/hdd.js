/**
 * User: nick
 * Date: 11/15/13
 * Time: 1:47 PM
 *
 *  Requires:  global.js
 *
 *      Hdd.js
 *
 *      Represents a virtual hard disk drive comprised of 4 tracks, 8 sectors, 8 blocks (64 b/block)
 *      this.spindle is a reference to localStorage containing keys for all blocks on the disk
 *      This file provides the raw virtual device and lowest level operations for modifying block contents.
 *      The driver provides an API to these low level routines.
 *      The kernel makes API calls based on commands received via the shell
 *
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
    this.mbr        = HDD_MBR_ADDRESS;  //address of the mbr

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

    //Generates a default empty block for this system based on the globals for t,s,b and block size
    //NOTE - No EOFs generated because those are fs implementation details handled by the driver (format)
    this.initFileBlock = function()
    {
        //TODO MOVE THIS TO THE DRIVER!!!!
        //default file information  [0/1/2 = free/used/chain, tt(next), ss(next), bb(next)]
        var val = ["00","--","--","--"];  //not much better than a magic number
        var metaDataLength = val.length;

        //build the rest of the "physical" blocks
        for (var i = 0; i < (this.blockSize - metaDataLength); i++)
        {
            val.push("--");
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
    this.writeBlock = function(param)
    {
        this.spindle.setItem(param[0], param[1]);
    };

    //Clear a block of data on the spindle
    //Param = spindle key ("t.s.b")
    this.clearBlock = function(param)
    {
        //TODO - MAKE SURE DRIVER SETS HDD_FILE_DEFAULT_DATA
        this.spindle.setItem(param, HDD_FILE_DEFAULT_DATA);
    };

    //TODO - implement functions to keep MBR up to date (next block, used, free, etc...)
}
