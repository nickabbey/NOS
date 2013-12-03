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
    //file system metadata constants
    this.mbrDescriptor  = "NOS FS V1";  //A way to identify the file system installed on the disk.
    this.mbrAddress     = "0.0.0";      //the default location of the mbr
    this.emptyCell      = "-";          //this is what a formatted, empty byte looks like
    this.freeBlock      = "0";          //first bit 0 = free block
    this.usedBlock      = "1";          //first bit 1 = used block, 1 file in 1 block
    this.freeBlock      = "0";          //first bit 0 = free block
    this.chainedBlock   = "2";          //first bit 2 = used block, 1 file in more than 1 blocks
    this.systemBlock    = "3";          //first bit 3 = used block, 1 system file in 1 or more blocks
    this.eof            = "$";          //The end of file character
    this.invalidChars   = [this.eof,    //these chars are forbidden from appearing in file names
                           ""];

    //fields
    this.emptyFatBlock      = "";       //Formatted, empty block valid for writing to FAT or file
    //this.emptyFileBlock     = "";       //this.emptyFileBlock === this.emptyFatBlock
    this.firstFileAddy      = "";       //the very first tsb address that can contain File data
    this.firstFatAddy       = "";       //the very first tsb address that can contain FAT info
    this.mbrDescriptorBlock = "";       //the block data version of the mbr descriptor
    this.mbrBlockData       = "";       //look at this.updateMbrData for info
    this.isFree             = true;     //false when an operation is in progress.

    //methods
    this.init = function()
    {
        //Set the defaults for this file system
        this.emptyFatBlock = this. initEmptyFatBlock();
        this.mbrDescriptorBlock = this.dotify(this.mbrDescriptor);
        this.firstFatAddy = this.getFirstFatAddress();
        this.firstFileAddy = this.getFirstFileAddress();

        //Set up the OS globals for use with this file system
        HDD_MBR_ADDRESS = this.mbrAddress;
        //Fat metadata setup
        HDD_MAX_FAT_BLOCKS = this.getMaxFatBlocks();
        HDD_FREE_FAT_BLOCKS = HDD_MAX_FAT_BLOCKS;       //doing getFreeFatBlocks() the first time is wasteful
        HDD_USED_FAT_BLOCKS = 0;                        //doing getUsedFatBlocks() the first time is wasteful
        //File metadata setup
        HDD_MAX_FILE_BLOCKS = this.getMaxFileBlocks();
        HDD_FREE_FILE_BLOCKS = HDD_MAX_FILE_BLOCKS;     //doing getFreeFileBlocks() the first time is wasteful
        HDD_USED_FILE_BLOCKS = 0;                       //doing getUsedFileBlocks() the first time is wasteful

        //File sytsem globals
        FS_META_BITS = 5;                               //number of bits required for fs metadata = mask.t.s.b.eof
        FS_NEXT_FREE_FAT_BLOCK = this.mbrAddress;       //next block for a filename
        FS_NEXT_FREE_FILE_BLOCK = this.firstFileAddy;   //next block for file data

        //finalize the mbr default state
        this.mbrBlockData = this.getMbrBlockData();
    };

    //returns an updated MBR as block data suitable for writing directly to the mbr.
    this.getMbrBlockData = function()
    {
        var str =
            FS_NEXT_FREE_FAT_BLOCK  + "." + this.dotify(HDD_MAX_FAT_BLOCKS)  + "." + this.dotify(HDD_FREE_FAT_BLOCKS) + "." +
            FS_NEXT_FREE_FILE_BLOCK + "." + this.dotify(HDD_MAX_FILE_BLOCKS) + "." + this.dotify(HDD_FREE_FILE_BLOCKS) + "." +
            this.mbrDescriptorBlock + "." + this.eof;
        str = this.padBlock(str);

        return str;
    };

    //returns the first address available for use as FAT data
    //with the default hdd tsb, that is tsb === 001
    this.getFirstFatAddress = function()
    {
        //the first usable data address is the second block of the first sector of the first track
        var t = HDD_NUM_TRACKS - HDD_NUM_TRACKS;
        var s = HDD_NUM_SECTORS - HDD_NUM_SECTORS;
        var b = HDD_NUM_BLOCKS - HDD_NUM_BLOCKS + 1;

        return t.toString(16) + "." + s.toString(16) + "." + b.toString(16);
    };

    //returns the first address available for use as file data
    //with the default hdd tsb, that is tsb === 100
    this.getFirstFileAddress = function()
    {
        //the first usable data address is the first block of the first sector of the second track
        var t = HDD_NUM_TRACKS - HDD_NUM_TRACKS + 1;
        var s = HDD_NUM_SECTORS - HDD_NUM_SECTORS;
        var b = HDD_NUM_BLOCKS - HDD_NUM_BLOCKS;

        return t.toString(16) + "." + s.toString(16) + "." + b.toString(16);
    };

    //returns the next available free block for use as FAT data
    // If next free block is already set, it starts there.  Otherwise, it starts at mbr + 1 block
    //returns a t.s.b index if a free block is found, and  null if not
    this.getNextFreeFatBlock = function()
    {   //TODO - fix the nested loop escape ugliness - probably by breaking loops out to functions

        var retVal = null;              //initialize a return value
        var nextAddy = "";              //the next address to look at inside the loop
        var addyArray = [];             //for splitting FS_NEXT_FREE_FILE_BLOCK
        var t = 0;                      //Track counter
        var s = 0;                      //Sector counter
        var b = 0;                      //Block counter
        var nextBlockIndicator = "";    //the first byte in a block, tells if the block is free or not
        var nextBlockIsFree = false;    //while loop control
        var passes = 0;                 //while loop backup control
        var startAddy = "";             //while loop backup control

        //First, we need to know if already had a free block pointer
        if (FS_NEXT_FREE_FAT_BLOCK)
        {   //if we did, then break it down in to t.s.b for the loop

            addyArray = FS_NEXT_FREE_FAT_BLOCK.split(".");
            t = addyArray[0];
            s = addyArray[1];
            b = addyArray[2];

        }
        //We didn't have a free block, so we start at the beginning
        else
        {   //start by looking at the mbr (note that the b is incremented after this block so we don't risk overwriting the mbr)

            addyArray = this.firstFatAddy.split(".");
            t = addyArray[0];
            s = addyArray[1];
            b = addyArray[2];
        }

        //we need to know which t.s.b we started at so we don't waste time in the while loop
        startAddy = t + "." + s + "." + b;

        //passes is incremented when the last block of the last sector of the last track is passed
        //AND when the next block has wrapped around back to the first one we looked at
        outerWhile:
            while (!nextBlockIsFree)
            {   //start at the current FS_NEXT_FREE_FILE_BLOCK + 1

                //loop through the tracks
                for (t; t < HDD_NUM_TRACKS; t++)
                {
                    //if we're outside of the mbr, skip this track
                    if (t > 0) continue;

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
                // if we've gotten this far, the first pass of the while loop (from the initial state of FS_NEXT_FREE_FILE_BLOCK
                // through the last t.s.b address) failed to find a free block and we need to start at the beginning again

                //so we reset the t.s.b (to the first data address + 1)
                t = 0;
                s = 0;
                b = 1;

                // and we increment pass counter to guard against infinite loop (this should only ever happen once)
                passes += 1;
            }

        //will be null if nothing was found, or a t.s.b if something was found
        return retVal;
    };

    //returns the next available free block for use as file block
    //If next free block is already set, it starts there.  Otherwise, it starts at mbr + 1 block
    //returns a t.s.b index if a free block is found, and  null if not
    this.getNextFreeFileBlock = function()
    {   //TODO - fix the nested loop escape ugliness - probably by breaking loops out to functions

        var retVal = null;              //initialize a return value
        var nextAddy = "";              //the next address to look at inside the loop
        var addyArray = [];             //for splitting FS_NEXT_FREE_FILE_BLOCK
        var t = 0;                      //Track counter
        var s = 0;                      //Sector counter
        var b = 0;                      //Block counter
        var nextBlockIndicator = "";    //the first byte in a block, tells if the block is free or not
        var nextBlockIsFree = false;    //while loop control
        var passes = 0;                 //while loop backup control
        var startAddy = "";             //while loop backup control

        //First, we need to know if already had a free block pointer
        if (FS_NEXT_FREE_FILE_BLOCK)
        {   //if we did, then break it down in to t.s.b for the loop

            addyArray = FS_NEXT_FREE_FILE_BLOCK.split(".");
            t = addyArray[0];
            s = addyArray[1];
            b = addyArray[2];

        }
        //We didn't have a free block, so we start at the beginning
        else
        {   //start by looking at the mbr (note that the b is incremented after this block so we don't risk overwriting the mbr)

            FS_NEXT_FREE_FILE_BLOCK = this.firstFileAddy;
            addyArray = FS_NEXT_FREE_BLOCK.split(".");
            t = addyArray[0];
            s = addyArray[1];
            b = addyArray[2];
        }

        //we need to know which t.s.b we started at so we don't waste time in the while loop
        startAddy = t + "." + s + "." + b;

        //increment b to be sure that we don't overwrite the mbr or look at the current address in FS_NEXT_FREE_FILE_BLOCK
        b++;

        //passes is incremented when the last block of the last sector of the last track is passed
        //AND when the next block has wrapped around back to the first one we looked at
        outerWhile:
        while (!nextBlockIsFree)
        {   //start at the current FS_NEXT_FREE_FILE_BLOCK + 1

            //loop through the tracks
            for (t; t < HDD_NUM_TRACKS; t++)
            {
                //if we're in the mbr, continue to the next track
                if (t === 0) continue;

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
            // if we've gotten this far, the first pass of the while loop (from the initial state of FS_NEXT_FREE_FILE_BLOCK
            // through the last t.s.b address) failed to find a free block and we need to start at the beginning again

            //so we reset the t.s.b (to the first data address + 1)
            t = 0;
            s = 0;
            b = 1;

            // and we increment pass counter to guard against infinite loop (this should only ever happen once)
            passes += 1;
        }

        //will be null if nothing was found, or a t.s.b if something was found
        return retVal;
    };

    //returns the number of total blocks available to the system as FAT data
    //this implementation uses 1 track for FAT giving a max of 64 files
    //so return from this function should be 3F, or 63
    this.getMaxFatBlocks = function()
    {
        // 0-63 as integer
        var total = (HDD_NUM_SECTORS * HDD_NUM_BLOCKS) - 1; //-1 to make it 0-63 instead of 0-64

        //This breaks down for single digit hex values (not with the default tsb === 488
        //if the TSB value for a hdd is <  16 then the output needs to be padded
        return total.toString(16); // 3F

    };

    //returns the number of total blocks available to the system for file data
    //this implementation uses 3 tracks for Data, giving a max of 192 blocks
    //so returns from this function should be BF, or 191.
    this.getMaxFileBlocks = function()
    {
        // 0-191 as integer, first -1 is to account for fat track, second -1 is to adjust for 0 based indexing
        var total = ((HDD_NUM_TRACKS - 1) * HDD_NUM_SECTORS * HDD_NUM_BLOCKS) - 1;

        //This breaks down for single digit hex values (not with the default tsb === 488
        //if the TSB value for a hdd is <  16 then the output needs to be padded
        return total.toString(16); // BF


    };

    //returns the number of blocks in use for FAT data as a hex value lower than or equal to HDD_MAX_FILE_BLOCKS
    this.getUsedFatBlocks = function()
    {
        var used = null;

        //Do we already know our Used blocks?
        if (!HDD_USED_FAT_BLOCKS)
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

            used = HDD_USED_FAT_BLOCKS;
            used = parseInt(used, 16);
        }

        //and translate the integer to hex
        used = used.toString(16);

        return formatMemoryAddress(used);
    };

    //returns the number of blocks in use for file data as a hex value lower than or equal to HDD_MAX_FILE_BLOCKS
    this.getUsedFileBlocks = function()
    {
        var used = null;

        //Do we already know our Used blocks?
        if (!HDD_USED_FILE_BLOCKS)
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

            used = HDD_USED_FILE_BLOCKS;
            used = parseInt(used, 16);
        }

        //and translate the integer to hex
        used = used.toString(16);

        return formatMemoryAddress(used);
    };

    //returns the free Fat blocks as a hex value lower than or equal to HDD_MAX_FILE_BLOCKS
    this.getFreeFatBlocks = function()
    {
        var max = null;
        var used = null;
        var free = null;

        if (!HDD_MAX_FAT_BLOCKS)
        {
            HDD_MAX_FAT_BLOCKS = this.getMaxFatBlocks();
        }

        max = HDD_MAX_FAT_BLOCKS;
        max = parseInt(max,16);

        if (!HDD_USED_FAT_BLOCKS)
        {
            HDD_USED_FAT_BLOCKS = this.getUsedFatBlocks();
        }

        used = HDD_USED_FAT_BLOCKS;
        used = parseInt(used,16);

        free = max - used;

        free = free.toString(16);

        return formatMemoryAddress(free);
    };

    //returns the free Data blocks as a hex value lower than or equal to HDD_MAX_FILE_BLOCKS
    this.getFreeFileBlocks = function()
    {
        var max = null;
        var used = null;
        var free = null;

        if (!HDD_MAX_FILE_BLOCKS)
        {
            HDD_MAX_FILE_BLOCKS = this.getMaxFileBlocks();
        }

        max = HDD_MAX_FILE_BLOCKS;
        max = parseInt(max,16);

        if (!HDD_USED_FILE_BLOCKS)
        {
             HDD_USED_FILE_BLOCKS = this.getUsedFileBlocks();
        }

        used = HDD_USED_FILE_BLOCKS;
        used = parseInt(used,16);

        free = max - used;

        free = free.toString(16);

        return formatMemoryAddress(free);
    };

    //returns an uninitialized block (mainly used for formatting)
    //NOTE: an empty file block === an empty FAT block
    this.initEmptyFatBlock = function()
    {
        return this.makeMetaData(this.freeBlock, this.mbrAddress) + "." + this.makeDirBlock("");
    };

    //Returns a string that is ready to be be prepended to block data
    //param mask = (this.usedBlock || this.freeBlock || this.chainBlock || this.systemBlock)
    //param address = "dotified" tsb IE) 1.0.0
    this.makeMetaData = function(mask, address)
    {
        return mask.toString(16) + "." + address;
    };

    //Return an array of strings that may be written to data blocks (aka file blocks)
    //param is a string that may be > HDD_BLOCK_SIZE - FS_META_BITS
    //NOTE: prepend metadata before writing
    //TODO - GET THIS WORKING!!!
    this.makeFileBlock = function(source)
    {
        var numBlocks = (source.length -1) % (HDD_BLOCK_SIZE - FS_META_BITS);
        var blocks = [];
    };

    //Return directory block data (aka file names)
    //Param is a string, must be less than HDD_BLOCK_SIZE + FS_META_BITS in length
    //NOTE: Metadata has no place here, just a file name as a string
    //TODO - HANDLE FILE NAME TOO LONG
    this.makeDirBlock = function(param)
    {
        var str = param + this.eof;

        var retString   = null;
        if (str.length < HDD_BLOCK_SIZE + FS_META_BITS)
        {
            str = this.dotify(str);
            retString = this.padBlock(str);
        }

        return retString;
    };

    //returns a string correctly formatted for use in a block
    this.dotify = function(str)
    {
        var source = str.split(""); //split on every character
        return source.join(".");    //join with "." separator
    };

    //strips the dots from a string
    this.undotify = function(str)
    {
        var source = str.split("."); //split on every "." character
        return source.join("");    //join with empty string (comma is default)
    };

    //returns a dotified, padded block that may be used as either file or FAT data
    //param is a dotified string that is shorter than HDD_BLOCK_SIZE - FS_META_BITS
    //TODO - Does this need error checking?
    this.padBlock = function(param)
    {
        //split the input on periods (because blocks are always dotified
        var inVal = param.split(".");
        var retVal = "";

        //pad the block
        for (var i = inVal.length; i < HDD_BLOCK_SIZE - 1; i++) //-1 to account for zero based indexing
        {
            inVal.push(this.emptyCell);
        }

        //and turn it back in to a "." delimited string (join doesn't work for some weird reason?)
        //TODO try to make string.join work here
        retVal = inVal.join(".");
//        for (var j = 0; j < inVal.length; j++)
//        {
//            retVal = retVal + inVal[j] + ".";
//        }
//
//        //trim the trailing "."
//        retVal = retVal.slice(0, retVal.length - 1);

        return retVal;
    }


}
