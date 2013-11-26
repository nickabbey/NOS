/**
 * Nosfs.js
 *
 * Requires globals.js
 * Required deviceDriverHDD.js
 *
 * Nos File System Driver.  Provides file system implementation details.
 * Describes the way data is written to the hard disk.

 */

function Nosfs()
{
    //fields
    this.mbrDescriptor  = "NOS File System, V1.0";  //A way to identify the file system installed on the disk.
    this.mbrAddress     = "00.00.00";               //the default location of the mbr
    this.eof            = "$$";                     //The end of file character
    this.dirMeta        = "00.00.00.00";            //the meta data for a blank formatted directory
    this.dirData        = "";                       //the data for a blank formatted directory aka "file name"
    this.fileMeta       = "00.00.00.00";            //the meta data for a blank formatted file
    this.fileData       = "";                       //the data for a blank formatted file aka "file contents"
    this.emptyCell      = "--";                     //this is what a formatted, empty block data looks like
    this.nextFreeBlock  = "00.00.01";               //The first writable block of the hard drive

    //MBR data section is reserved for fs info:
    //                next free t,s,b,    max blocks,             free blocks,                file system info
    this.mbrData        = "";



    //methods

    this.init = function()
    {
        var mbrString = "";  //the initial mbrData

        //set the fs globals
        HDD_MBR_ADDRESS = this.mbrAddress;
        HDD_MAX_BLOCKS = this.getMaxBlocks();
        HDD_FREE_BLOCKS = this.getFreeBlocks();
        HDD_USED_BLOCKS = this.getUsedBlocks();
        FS_NEXT_FREE_BLOCK = this.nextFreeBlock;
        FS_META_BITS = 4;

        //set the fs defaults
        this.fileData = this.initEmptyFileBlock();
        this.dirData = this. initEmptyFileBlock();

        mbrString = this.makeBlock(this.mbrDescriptor);
        this.mbrData = this.nextFreeBlock + "." + HDD_MAX_BLOCKS + "." + HDD_FREE_BLOCKS + "." + mbrString[0] + this.eof;
    };

    //determines the number of total blocks available to the system
    //returns a 4 digid hex string delimited by "."
    //Supports maximum of 65,535 blocks (0000 - FFFF)
    this.getMaxBlocks = function()
    {
        // 0-6535 as integer
        var total = HDD_NUM_TRACKS * HDD_NUM_SECTORS * HDD_NUM_BLOCKS * HDD_BLOCK_SIZE;
        //"0000" - "FFFF"
        var retVal = parseInt(total, 16).toString();

        //"00.00" to "FF.FF"
        return retVal.substring(0, 1) + "." + retVal.substring(3);
    };

    //determines used blocks by reading the mbr or counting if mbr isn't initialized
    //returns a 4 digid hex string delimited by "."
    this.getUsedBlocks = function()
    {
        var used = null;

        //Do we already know our Used blocks?
        if (!HDD_USED_BLOCKS)
        {   //if not, we need to count

            var testStr = null; //we're going to need to hold the value for a block to see if it's free or not
            var used    = 0;    //initialize a counter

            //then we can start looping through the blocks
            for(var i = 0; i < _HddList[0].spindle.length; i++)
            {
                //get the data at this block
                testStr = _HddList[0].spindle.getItem(i);

                //focus on it's first bit
                testStr = testStr.substr(0,2);

                //if the first bit is not zero, then the block is in use
                if (testStr != "00")
                {   // so we update the counter
                    used++;
                }
            }
        }
        //We DO know our used blocks
        else
        {   //so we just translate the hex

            used = HDD_USED_BLOCKS;
            used = used.substr(0,1) + used.substr(3,4);
            used = parseInt(used, 16);
        }

        //and translate the integer to 4 digit hex string split by a "."
        used = used.toString(16);
        used = used.substr(0,1) + "." + used.substr(2,3);

        return used;
    };


    //determines the free blocks
    //returns a 4 digid hex string delimited by "."
    this.getFreeBlocks = function()
    {
        var max = null;
        var used = null;
        var free = null;

        if (!HDD_MAX_BLOCKS)
        {
            HDD_MAX_BLOCKS = this.getMaxBlocks();
        }

        max = HDD_MAX_BLOCKS;
        max = max.substr(0,1) + max.substr(3,4);
        max = parseInt(max,16);

        if (!HDD_USED_BLOCKS)
        {
             HDD_USED_BLOCKS = this.getUsedBlocks();
        }

        used = HDD_USED_BLOCKS;
        used = used.substr(0,1) + used.substr(3,4);
        used = parseInt(used,16);

        free = max - used;

        free = free.toString(16);
        free = free.substr(0,1) + "." + free.substr(2,3);

        return free;
    };

    //creates a string that can be used in HTML5 storage to represent an empty, formatted block
    this.initEmptyFileBlock = function()
    {
        var str = this.fileMeta;

        for (var i = 0; i < HDD_BLOCK_SIZE - FS_META_BITS; i++)
        {
            str = str.concat(this.emptyCell + ".");
        }
        //remove the trailing "."
        str = str.slice(0, - 1);

        return str;


    };

    /* Convert a string to block data
    Param is a string, if no param is passed, an empty block is returned.
    if param is <= block size, a block is returned
    if param is > block size, string is truncated and both block AND remainder are returned
    retVal[0] = the formatted block (suitable for insertion to spindle)
    vetVal[1] = null when param[0].length < block length
    vetVal[1] = remainder of truncated param[0]
    */
    this.makeBlock = function(param)
    {
        var str = param[0];
        var retVal = "";

        //test for null or zero length string
        if (str || str.length > 0)
        {   //valid parameter

            //check

            for (var i = 0; i < str.length; i++)
            {
                retVal = retVal.concat(str[i]);
                if (i%2 === 0)
                {
                    retVal = retVal.concat(".");
                }
            }
            //remove the trailing "."
            retVal = retVal.slice(0, - 1);

        }
        else
        {//invalid parameter, return an empty block
            retVal = this.fileData;

        }


    };


}
