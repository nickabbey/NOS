/* ----------------------------------
 DeviceDriverHDD.js

 Requires deviceDriver.js, nosfs.js (or other file system), globals.js

 The Hard Disk Drive Device Driver.
 Makes the disk available to the OS.
 Provides the disk access API.
 Requires a file system (nosfs, by default).

 //TODO move the case variables to the file system, and implement a state machine for the file system

 ---------------------------------- */

DeviceDriverHDD.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverHDD()                     // Add or override specific attributes and method pointers.
{
    // "Constructor" code.
    this.driverEntry = krnHddDriverEntry;
    this.isr = krnHddHandler;
}

function krnHddDriverEntry()
{
    // Initialization routine, sets up the file system defaults
    this.status = "loaded";

}

//Implementation of disk I/O API
//arguments passed in as params must be guaranteed by sender (null is an ok param)
function krnHddHandler(params)
{
    //"unwrap" the parameters
    var parameters = params[0];
    var command         = parameters[0];    //"zeroth" arugument is always the command
    var firstArgument   = parameters[1];    //first argument is usually the filename, exceptions listed below
    var nextArgument    = parameters[2];    //second argument is usually the data, exceptions listed below

    //reusable switch variables - MUST be initialized in each case before they are used
    var disk = FS_ACTIVE_HDD;
    var filename = null;
    var validFilename = true;
    var file = null;
    var fileExists = null;
    var filesInUse = null;
    var fatMeta = null;
    var fatData = null;
    var fileMeta = null;
    var fileData = null;
    var firstAdddy = null;
    var blocks = [];
    var i = 0;
    var t = 0;
    var s = 0;
    var b = 0;
    var retVal = false;

    //reset all the case variables to their defaults
    function resetState()
    {
        disk = FS_ACTIVE_HDD;
        filename = null;
        validFilename = true;
        file = null;
        fileExists = null;
        filesInUse = _FS.getFatList();
        fatMeta = null;
        fatData = null;
        fileMeta = null;
        fileData = null;
        firstAdddy = null;
        blocks = [];
        i = 0;
        t = 0;
        s = 0;
        b = 0;
        retVal = false;
    }

    //for reference HDD_IRQ_CODES = 0="FORMAT", 1="CREATE", 2="DELETE", 3="LIST", 4="READ", 5="WRITE"
    switch (command)
    {
        case "FORMAT":
        //LOCKS THE FILE SYSTEM WHILE RUNNING
        {
            //clean slate
            resetState();

            //write the mbr
            disk.writeBlock(FS_NEXT_FREE_FILE_BLOCK, _FS.mbrBlockData);

            for (i = 1; i < disk.spindle.length; i++)  //start at 1 to skip over the mbr
            {
                disk.writeBlock(sessionStorage.key(i), _FS.emptyFatBlock);
            }

            //advance the next free data block marker
            FS_NEXT_FREE_FILE_BLOCK = _FS.firstFileAddy;

            //advance the next free fat block marker
            FS_NEXT_FREE_FAT_BLOCK = _FS.firstFatAddy;

            //update the free data block count
            HDD_USED_FILE_BLOCKS = _FS.getFreeFileBlocks();

            //update the free fat block count
            HDD_USED_FAT_BLOCKS = _FS.getFreeFatBlocks();

            //update the mbr
            _FS.mbrBlockData = _FS.getMbrBlockData();

            //update the MBR after
            disk.writeBlock(_FS.mbrAddress, _FS.mbrBlockData);

            //release the FS
            _FS.isFree = true;

            _StdOut.putLine("Format operation complete");
            retVal = true;
        }
            break;

        case "CREATE":
        {
            //reset defaults used in this case
            resetState();

            //variables needed by this case
            filename = firstArgument;

            //if we got good arguments
            if (filename)
            {   //then check for free space

                //Do we have free space?
                if (FS_NEXT_FREE_FILE_BLOCK)
                {  // we have everything we need to write

                    //start by building the fat metadata
                    fatMeta = _FS.makeMetaData(_FS.usedBlock, FS_NEXT_FREE_FILE_BLOCK);

                    //then the actual fat block data
                    fatData = _FS.makeDirBlock(filename);

                    //now write the fatData to the next free FAT block
                    disk.writeBlock(FS_NEXT_FREE_FAT_BLOCK, fatMeta + "." + fatData);

                    //next build the file meta data
                    fileMeta = _FS.makeMetaData(_FS.usedBlock, FS_NEXT_FREE_FAT_BLOCK);

                    //and build the file block data
                    fileData = _FS.makeDirBlock("");  //this generates a "blank" file with "$" in the first bit

                    //now write the fileData to the next free file block
                    disk.writeBlock(FS_NEXT_FREE_FILE_BLOCK, fileMeta + "." + fileData);

                    //advance markers
                    FS_NEXT_FREE_FAT_BLOCK = _FS.getNextFreeFatBlock();
                    FS_NEXT_FREE_FILE_BLOCK = _FS.getNextFreeFileBlock();

                    //update file system statistics
                    HDD_USED_FILE_BLOCKS = _FS.getUsedFileBlocks();
                    HDD_USED_FAT_BLOCKS  = _FS.getUsedFatBlocks();
                    HDD_FREE_FILE_BLOCKS = _FS.getFreeFileBlocks();
                    HDD_FREE_FAT_BLOCKS  = _FS.getFreeFatBlocks();

                    //TODO - the next 2 lines might belong in the kernel on clock pulses, or outside this case block
                    //update the mbr block data
                    _FS.mbrBlockData = _FS.getMbrBlockData();

                    //write the updated mbr block data
                    disk.writeBlock(_FS.mbrAddress, _FS.mbrBlockData);

                    _StdOut.putLine("File created");
                    retVal = true;
                }
                //but if we don't, then we're out of space.
                else
                {   //so let the user know
                    krnTrace(this + "Insufficient free space to write this file.");
                }
            }
        }
            break;

        case "DELETE":
        {
            //reset the case variables to defaults
            resetState();

            //set the ones that matter right now
            filename = firstArgument;
            fileExists = false;
            file = null;
            firstAdddy = null;  //the fat table address for the file entry
            blocks = [];

            //if we got good arguments
            if (filename)
            {   //then check if the file exists

                if (filesInUse.length > 0)
                {
                    for (i = 0; i < filesInUse.length; i++)
                    {
                        if (filesInUse[i][1] === filename)
                        {
                            firstAdddy = filesInUse[i][0];  //fat address of the file we found
                            file = filesInUse[i][1];  //the filename (kind of redundant...)
                        }
                    }

                }
            }

            //Check if we found the file
            if(file)
            {   //when we were able to find the file we care about

                //get get the blocks allocated to that file
                blocks = _FS.getAllocatedBlocks(firstAdddy);

                //print out the blocks to the screen
                if (blocks)
                {

                    for(i =0; i<blocks.length; i++)
                    {
                        disk.writeBlock(blocks[i], _FS.emptyFatBlock);
                    }

                    disk.writeBlock(firstAdddy, _FS.emptyFatBlock);

                    FS_NEXT_FREE_FAT_BLOCK = firstAdddy;
                    FS_NEXT_FREE_FILE_BLOCK = blocks[0];

                    _StdOut.putLine("Delete completed");
                    retVal = true;
                }
                else
                {
                    krnTrace(this + "Delete failed, getting allocated blocks failed");
                }


            }
            else
            //we didn't find the file we wanted
            {
                krnTrace(this + "Delete failed, file not found");
            }
        }
            break;

        case "LIST":
        {
            //reset the case variables to defaults
            resetState();

            if (filesInUse.length > 0)
            {
                _StdOut.putLine("Found these files: ");
                for (i = 0; i < filesInUse.length; i++)
                {
                    _StdOut.putLine(filesInUse[i][1]);
                }
                retVal = true;
                _OsShell.putPrompt();
            }

        }
            break;

        case "READ":
        {
            //reset the case variables to defaults
            resetState();

            //set the ones that matter right now
            filename = firstArgument;
            fileExists = false;
            file = null;
            firstAdddy = null;  //the fat table address for the file entry
            blocks = [];

            //if we got good arguments
            if (filename)
            {   //then check if the file exists

                if (filesInUse.length > 0)
                {
                    for (i = 0; i < filesInUse.length; i++)
                    {
                        if (filesInUse[i][1] === filename)
                        {
                            firstAdddy = filesInUse[i][0];  //fat address of the file we found
                            file = filesInUse[i][1];  //the filename (kind of redundant...)
                        }
                    }

                }
            }

            //Check if we found the file
            if(file)
            {   //when we were able to find the file we care about

                //get get the blocks allocated to that file
                blocks = _FS.getAllocatedBlocks(firstAdddy);

                //print out the blocks to the screen
                if (blocks)
                {
                    for(i =0; i<blocks.length; i++)
                    {
                        _StdOut.putLine("Contents of file " + _FS.getBlockData(firstAdddy) + ": ");
                        _StdOut.putLine(_FS.getBlockData(blocks[i]));
                    }

                    retVal = true;

                }
                else
                {
                    krnTrace(this + "Read failed, getting allocated blocks failed");
                }


            }
            else
            //we didn't find the file we wanted
            {
                krnTrace(this + "Read failed, file not found");
            }
        }
            break;

        case "WRITE":
        {
            //reset the case variables to defaults
            resetState();

            //set the ones that matter right now
            filename = firstArgument;
            fileData = nextArgument;
            fileExists = false;
            file = null;
            firstAdddy = null;  //the fat table address for the file entry

            if (filesInUse.length > 0)
            {
                for (i = 0; i < filesInUse.length; i++)
                {
                    if (filesInUse[i][1] === filename)
                    {
                        firstAdddy = filesInUse[i][0];  //fat address of the file we found
                        file = filesInUse[i][1];  //the filename (kind of redundant...)
                    }
                }

            }

            //Check if we found the file
            if(file)
            {   //when we were able to find the file we care about

                //allocate your blocks firstAddy is a FAT address
                blocks = _FS.allocateBlocks(fileData, firstAdddy);

                if (blocks)
                {
                    for(i =0; i<blocks.length; i++)
                    {
                        disk.writeBlock(blocks[i][0],blocks[i][1]);
                    }

                    _StdOut.putLine("Write complete");
                    retVal = true;
                }
                else
                {
                    krnTrace(this + "Write failed, block allocation failed");
                }


            }
            else
            //we didn't find the file we wanted
            {
                krnTrace(this + "Write failed, file not found");
            }
        }
            break;

        default:
            krnTrapError(this + "Invalid disk operation");
    }

    //keep the filename cache up to date
    FS_FILENAMES = _FS.getFatList();
    return retVal;
}

//returns the entire block for the address and disk specified
function getBlock(address, diskId)
{
    var disk = _HddList[diskId];
    var retVal = null;
    if(disk)
    {
        retVal = disk.readBlock(address);
    }
    else
    {
        if (_HddList[0])
        {
            retVal = _HddList[0].readBlock(address)
        }
        else
        {
            krnTrace(this + "Block read failed for disk ID " + diskId.toString(16));
        }
    }

    return retVal;
}

