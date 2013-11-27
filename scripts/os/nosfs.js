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
    this.mbrDescriptor  = "NOS File System Version 1";  //A way to identify the file system installed on the disk.
    this.mbrBlockData   = "";                           //the block data version of the descriptor
    this.mbrAddress     = "0.0.0";                      //the default location of the mbr
    this.eof            = "$";                          //The end of file character
    this.dirData        = "";                           //the data for a blank formatted directory aka "file name"
    this.fileMeta       = "0.0.0.0";                    //the meta data for a blank files and dirs
    this.fileData       = "";                           //the data for a blank formatted file aka "file contents"
    this.emptyCell      = "-";                          //this is what a formatted, empty byte looks like

    //MBR data section is reserved for fs info:
    //                next free t.s.b, max blocks, free blocks, fs descriptor info
    this.mbrData        = "";

    //methods
    this.init = function()
    {
        //set the fs globals
        HDD_MBR_ADDRESS = this.mbrAddress;
        HDD_MAX_BLOCKS = this.getMaxBlocks();
        HDD_FREE_BLOCKS = HDD_MAX_BLOCKS;       //doing getFreeBlocks() the first time is wasteful
        HDD_USED_BLOCKS = 0;                    //doing getUsedblocks() the first time is wasteful
        FS_NEXT_FREE_BLOCK = this.mbrAddress;
        FS_META_BITS = 4;

        //set the fs defaults
        this.fileData = this.initEmptyFileBlock();
        this.dirData = this. initEmptyFileBlock();
        this.mbrBlockData = this.makeBlock(this.mbrDescriptor)[0];
        this.updateMbrData();
    };

    //updates the MBR data, uses the cached mbrBlockData so that the mbrBlockData isn't rebuilt every time
    this.updateMbrData = function()
    {
        var str = FS_NEXT_FREE_BLOCK + "." + HDD_MAX_BLOCKS + "." + HDD_FREE_BLOCKS + "." + this.mbrBlockData;
        str = this.padBlock(str);

        this.mbrData = str;
    };

    //finds the next available free block.  If next free block is already set, it starts there.  Otherwise, it starts
    //at mbr + 1 block
    //returns a t.s.b index if a free block is found, and  null if not
    this.findNextFreeBlock = function()
    {
        var retVal = null;              //initialize a return value
        var nextAddy = "";              //the next address to look at inside the loop
        var addyArray = [];             //for splitting FS_NEXT_FREE_BLOCK
        var t = 0;                      //Track counter
        var s = 0;                      //Sector counter
        var b = 0;                      //Block counter
        var nextBlockIndicator = "";    //the first byte in a block, tells if the block is free or not
        var nextBlockIsFree = false;    //while loop control
        var passes = 0;                 //while loop backup control
        var startAddy = "";             //while loop bakcup control

        //First, we need to know if already had a free block pointer
        if (FS_NEXT_FREE_BLOCK)
        {   //if we did, then break it down in to t.s.b for the loop

            addyArray = FS_NEXT_FREE_BLOCK.split(".");
            t = addyArray[0];
            s = addyArray[1];
            b = addyArray[2];

        }
        //We didn't have a free block, so we start at the beginning
        else
        {   //start by looking at the mbr (note that the b is incremented after this block so we don't risk overwriting the mbr)

            FS_NEXT_FREE_BLOCK = this.mbrAddress;
            addyArray = FS_NEXT_FREE_BLOCK.split(".");
            t = addyArray[0];
            s = addyArray[1];
            b = addyArray[2];
        }

        //we need to know which t.s.b we started at so we don't waste time in the while loop
        startAddy = t + "." + s + "." + b;

        //increment b to be sure that we don't overwrite the mbr or look at the current address in FS_NEXT_FREE_BLOCK
        b++;

        //passes is incremented when the last block of the last sector of the last track is passed
        //AND when the next block has wrapped around back to the first one we looked at
        outerWhile:
        while (!nextBlockIsFree)
        {   //start at the current FS_NEXT_FREE_BLOCK + 1

            //loop through the tracks
            for (t; t < HDD_NUM_TRACKS; t++)
            {
                //loop through the sectors
                for(s; s < HDD_NUM_SECTORS; s++)
                {
                    //loop through the blocks
                    for (b; b < HDD_NUM_BLOCKS; b++)
                    {
                        //for each block, we get it's full t.s.b address
                        nextAddy = t + "." + s + "." + b;
                        //get the block
                        nextBlockIndicator = _HddList[0].spindle.getItem(nextAddy);
                        //look at the first 2 chars of the block
                        nextBlockIndicator = nextBlockIndicator.slice(0,1);

                        //is it free?
                        if(nextBlockIndicator === "0")
                        {   //if so update our retval
                            retVal = nextAddy;
                            //and break out of our loop
                            nextBlockIsFree = true;
                            break outerWhile;
                        }

                        //have we visited every availlable t.s.b and looped around to our start point?
                        if(nextAddy === startAddy)
                        {   //if so, then update passes again

                            //this should only ever be done once, and will result in the retVal staying null
                            passes++;
                        }
                        if (passes >= 2)
                        {
                            break outerWhile;
                        }
                    }
                }
            }
            // if we've gotten this far, the first pass of the while loop (from the initial state of FS_NEXT_FREE_BLOCK
            // through the last t.s.b address) failed to find a free block and we need to start at the beginning again

            //so we reset the t.s.b (to the mbr + 1)
            t = 0;
            s = 0;
            b = 1;

            // and we increment pass counter to guard against infinite loop (this should only ever happen once)
            passes += 1;
        }

        //will be null if nothing was found, or a t.s.b if something was found
        return retVal;
    };

    //determines the number of total blocks available to the system
    //returns a 4 digid hex string delimited by "."
    //Supports maximum of 65,535 blocks (0000 - FFFF)
    this.getMaxBlocks = function()
    {
        // 0-256 as integer
        var total = (HDD_NUM_TRACKS * HDD_NUM_SECTORS * HDD_NUM_BLOCKS) - 1; //-1 to make it 0-255 instead of 0-256
        //"00" - "FF"
        return total.toString(16);

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
                testStr = _HddList[0].spindle.getItem(_HddList[0].spindle.key(i));

                //focus on its first bit
                testStr = testStr.substr(0,1);

                //if the first bit is not zero, raw, or empty, then the block is in use
                if (!(testStr === "0" || testStr === "~" || testStr == "-"))
                {   // so we update the counter
                    used++;
                }
            }
        }
        //We DO know our used blocks
        else
        {   //so we just translate the hex

            used = HDD_USED_BLOCKS;
            used = parseInt(used, 16);
        }

        //and translate the integer to hex
        used = used.toString(16);

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
        max = parseInt(max,16);

        if (!HDD_USED_BLOCKS)
        {
             HDD_USED_BLOCKS = this.getUsedBlocks();
        }

        used = HDD_USED_BLOCKS;
        used = parseInt(used,16);

        free = max - used;

        free = free.toString(16);

        return free;
    };

    //creates a string that can be used in HTML5 storage to represent an empty, formatted block
    this.initEmptyFileBlock = function()
    {
        var str = this.fileMeta + "." + "$" + ".";

        for (var i = 0; i < (HDD_BLOCK_SIZE - FS_META_BITS - 1); i++) //-1 for the eof
        {
            str = str.concat(this.emptyCell + ".");
        }
        //remove the trailing "."
        str = str.slice(0, (str.length -1));

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
        var str         = param;
        var retString   = "";
        var retOverflow = null;
        var retVal      = [retString, retOverflow];

        //test for null or zero length string
        if (str && str.length != 0)
        {   //valid parameter of length > 0

            //check for strings that are too big to fit in a block
            if (str.length > (HDD_BLOCK_SIZE - FS_META_BITS - 1)) // the -1 is for the eof
            {   //string was too big to fit, so truncate it for conversion while saving overflow
                retOverflow = str.slice((str.length - HDD_BLOCK_SIZE - FS_META_BITS - 1), str.length);
                str = str.slice(0, (HDD_BLOCK_SIZE - FS_META_BITS - 1));
            }

            //loop through the string and insert "." delimiters
            for (var i = 0; i < str.length; i++)
            {
                retString = retString + ".";
                retString = retString + str[i];
            }

            //remove the leading "."
            retString = retString.slice(1,retString.length);

            //check to see if the last character is a "."
            if (retString[retString.length-1] != ".")
            {   //add the "." if needed
                retString = retString + ".";
            }

            //Append the eof char to the string
            retString = retString + this.eof;
        }
        //params are null
        else
        { //no string was given
            retString = this.fileData;
        }

        retVal[0] = retString;
        retVal[1] = retOverflow;    //null when the string fits in the block

        return retVal;
    };

    //takes block of length < HD_BLOCK_SIZE and pads it with empty space to fill a block
    this.padBlock = function(param)
    {
        //split the input on periods
        var inVal = param.split(".");
        var retVal = "";

        //pad the block
        for (var i = inVal.length - 1; i < HDD_BLOCK_SIZE -1 ; i++)  //the -1 is to account for the eof char
        {
            inVal.push("-");
        }

        //and turn it back in to a "." delimited string (join doesn't work for some weird reason?)

        for (var j = 0; j < inVal.length; j++)
        {
            retVal = retVal + inVal[j] + ".";
        }

        //trim the trailing "."
        retVal = retVal.slice(0, retVal.length - 1);

        return retVal;
    }
}
