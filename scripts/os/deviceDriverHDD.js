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
function krnHddHandler(params)
{
//for reference HDD_IRQ_CODES = 0="FORMAT", 1="CREATE", 2="DELETE", 3="LIST", 4="READ", 5="WRITE"

    var command         = params[0];    //"zeroth" arugument is always the command
    var firstArgument   = params[1];    //first argument is usually the filename, exceptions listed below
    var nextArgument    = params[2];    //second argument is usually the data, exceptions listed below

    switch (command)
    {
        case "FORMAT":
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
                    {   //and if that's true then we actually perform the format

                        //get the disk we're formatting by diskID
                        disk = _HddList[diskID];
                        //and do that actual work of formatting
                        for (var i = 0; i < disk.spindle.length; i++)
                        {
                            disk.writeBlock([sessionStorage.key(i), _FS.dirData]);
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
                    for (var i = 0; i < disk.spindle.length; i++)
                    {
                        disk.writeBlock([sessionStorage.key(i), _FS.dirData]);
                    }
                }
                //if it doesn't, then the user needs to know
                else
                {
                    hostLog(this + "format failed, disk not present");
                }
            }

            break;
        case "CREATE":
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