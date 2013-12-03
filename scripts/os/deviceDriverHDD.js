/* ----------------------------------
 DeviceDriverHDD.js

 Requires deviceDriver.js, nosfs.js (or other file system), globals.js

 The Hard Disk Drive Device Driver.
 Makes the disk available to the OS.
 Provides the disk access API.
 Requires a file system (nosfs, by default).
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

    //for reference HDD_IRQ_CODES = 0="FORMAT", 1="CREATE", 2="DELETE", 3="LIST", 4="READ", 5="WRITE"
    switch (command)
    {
        case "FORMAT":
        {
            var diskID = firstArgument;
            var disk = null;

            //was a diskID specified?
            if (diskID)
            {   //if it was then that's the disk we format

                //first make sure the diskID is a valid number
                if (typeof diskID === "number")
                {   //if it is, then we need to make sure it's a valid diskID

                    //so we look to see if it's out of bounds
                    if(diskID < _HddList.length)
                    {   //if it's a good ID, then we actually perform the format

                        //get the disk we're formatting by diskID
                        disk = _HddList[diskID];

                        //write the mbr
                        disk.writeBlock(FS_NEXT_FREE_DATA_BLOCK, _FS.mbrBlockData);

                        //and do that actual work of formatting
                        for (var i = 1; i < disk.spindle.length; i++) //start at one to skip past the mbr
                        {
                            disk.writeBlock(sessionStorage.key(i), _FS.emptyDirData);
                        }
                    }
                    //if the disk id given is not valid, the user needs to know
                    else
                    {
                        hostLog(this + "format failed, invalid argument: diskID out of bounds");
                    }
                }
                //if the diskID was not a number, the user needs to know
                else
                {
                    hostLog(this +"format failed, invalid argument: diskID not a number");
                }
            }
            //when a disk ID wasn't specified  - alan's test scripts will do this
            else
            {   //first we look to see if the default disk exists
                if(_HddList[0])
                {   //when the default drive is there, we just format it

                    disk = _HddList[0];

                    //write the mbr
                    disk.writeBlock(FS_NEXT_FREE_DATA_BLOCK, _FS.mbrBlockData);

                    for (var i = 1; i < disk.spindle.length; i++)  //start at 1 to skip over the mbr
                    {
                        disk.writeBlock(sessionStorage.key(i), _FS.emptyDirData);
                    }
                }
                //if it doesn't, then the user needs to know
                else
                {
                    hostLog(this + "format failed, disk not present");
                }
            }

            //advance the next free data block marker
            FS_NEXT_FREE_DATA_BLOCK = _FS.firstDataAddy;

            //advance the next free fat block marker
            FS_NEXT_FREE_FAT_BLOCK = _FS.firstFatAddy;

            //update the free data block count
            HDD_USED_DATA_BLOCKS = _FS.getFreeDataBlocks();

            //update the free fat block count
            HDD_USED_FAT_BLOCKS = _FS.getFreeFatBlocks();

            //update the mbr
            _FS.mbrBlockData = _FS.getMbrBlockData();

            //update the MBR after
            disk.writeBlock(_FS.mbrAddress, _FS.mbrBlockData);

        }  //case is contained in a block for ide formatting
            break;

        case "CREATE":
        {
            var filename = firstArgument;
            var validFilename = true;
            var file = null;
            var diskID = nextArgument;
            var disk = null;

            //was a filename specified?
            if (filename)
            {   //if it was then we set the target filename

                //first make sure the filename is a string
                if (typeof filename === "string")
                {   //when we have a valid string argument, we need to look for invalid chars

                    //first things first, is the string too long?
                    if (filename.length > HDD_BLOCK_SIZE - FS_META_BITS)
                    {   //filename is too long to fit in the fat table

                        //so it's invalid
                        validFilename = false;
                    }
                    //when the length is ok, we need to check for invalid characters
                    else
                    {
                        //TODO - MAKE THIS WORK!!
//                    //for each character in the filename, check if it is a forbidden character
//                    for (var i = 0; i < filename.length-1; i++)
//                        {   //if this char is forbidden, update validFilename
//                            if (_FS.invalidChars.indexOf(filename[i]))
//                                {
//                                    validFilename = false;
//                                }
//                            }
                    }
                    //by the time we get here, we know for sure if the filename is valid or not
                }
                //when the filename isn't a string, notify the user
                else
                {   //tell the user that they gave bad input for the filename
                    hostLog(this + "file creation failed, invalid argument: filename not a string");
                }

            }
            else
            //filename was not given
            {   //tell the user that they forgot to give a filename argument
                hostLog(this +"file creation failed, missing argument: filename");
            }

            //was a disk ID specified?
            if (diskID)
            {   //if it was then that's the disk we format

                //first make sure the diskID is a valid number
                if (typeof diskID === "number")
                {   //if it is, then we need to make sure it's a valid diskID

                    //so we look to see if it's out of bounds
                    if(diskID < _HddList.length)
                    {   //when it is in bounds we actually perform the format

                        //target disk is now set for writing
                        disk = _HddList[diskID];
                    }
                    else
                    {   //when it's out of bounds, we tell the user
                        hostLog(this + "file creation failed, invalid argument: diskID out of bounds");
                    }
                }
                else
                {   //or if the diskID was not a number, the user needs to know
                    hostLog(this +"file creation failed, invalid argument: diskID not a number");
                }
            }
            //when a disk ID wasn't specified  - alan's test scripts will do this
            else
            {   //first we look to see if the default disk exists
                if(_HddList[0])
                {   //when the default drive is there, we just set it to the target

                    //target disk is now set for writing
                    disk = _HddList[0];
                }
                //if it doesn't, then the user needs to know
                else
                {
                    hostLog(this + "format failed, disk not present");
                }
            }

            //if we got good arguments
            if (validFilename && disk)
            {   //then check for free space

                //start by finding the next available block
                var targetDataBlock = FS_NEXT_FREE_DATA_BLOCK;

                //so long as we have one, we can write
                if (targetDataBlock)
                {  //prep for write

                    //start by building the fat block metadata
                    var dirBlockMeta = _FS.makeMetaData(_FS.usedBlock, FS_NEXT_FREE_FAT_BLOCK);

                    //then the actual fat block data
                    var dirBlockData = _FS.makeDirBlock(filename);

                    //now get a fat block

                    //now write the full directory block to the FAT
                    disk.writeBlock(FS_NEXT_FREE_FAT_BLOCK, dirBlockMeta + "." + dirBlockData);

                    //next build the file meta data
                    var fileBlockMeta = _FS.makeMetaData(_FS.usedBlock, FS_NEXT_FREE_DATA_BLOCK);

                    //then the file data
                    //TODO - FIX THIS FOR MULTIBLOCK FILES!!!
                    var blockFileData = _FS.makeDirBlock("");  //this generates a "blank" file with "$" in the first bit

                    //and write the data to the next free tsb
                    disk.writeBlock(FS_NEXT_FREE_DATA_BLOCK, fileBlockMeta + "." + blockFileData);

                    //advance the next free fat block marker
                    FS_NEXT_FREE_FAT_BLOCK = _FS.findNextFreeFatBlock();

                    //advance the next free data block marker
                    FS_NEXT_FREE_DATA_BLOCK = _FS.findNextFreeDataBlock();

                    //update the free block count
                    HDD_USED_DATA_BLOCKS = _FS.getFreeDataBlocks();

                    //update the mbr
                    _FS.mbrBlockData = _FS.getMbrBlockData();

                    //update the MBR after
                    disk.writeBlock(_FS.mbrAddress, _FS.mbrBlockData);

                    krnTrace(this + "File created");
                }
                //but if we don't, then we're out of space.
                else
                {   //so let the user know
                    krnTrace(this + "Insufficient free space to write this file.");
                    //TODO - check this, may need a better way to exit this routing
                    //this break is meant to take us out of the if (validFilename && disk) block
                    break;
                }
            }
            //when we didn't get a valid filename
            else if (!validFilename)
            {
                krnTrace(this + "File create failed, invalid filename: " + parameters[1].toString());
            }
            //when we encounter any kind of disk error
            else if (!disk)
            {
                krnTrace(this + "File creation failed, Disk " + params[2].toString(16) + " not ready");
            }
        }
            break;
        case "DELETE":
            break;
        case "LIST":
            break;
        case "READ":
            break;
        case "WRITE":
            break;

        default:
            krnTrapError(this + "Invalid disk operation");
    }

}