/**
 * User: nick
 * Date: 11/1/13
 *
 *  Device driver for software interrupts
 */

DeviceDriverSoftware.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverSoftware()                     // Add or override specific attributes and method pointers.
{
    this.driverEntry = krnSwDriverEntry;
    this.isr = krnSWIHandler;
}

function krnSwDriverEntry()
{
    this.status = "loaded";
}

//Software Interrupt Handler, the ISR for software interrupts
function krnSWIHandler(params)
{
    switch (params)
    {
        case "MEMORY":
            krnTrace(this + "A Memory error has occurred");
            break;
        case "OPCODE":
            krnTrace(this + "Invalid Opcode detected");
            break;
        default:
            krnTrace(this + "Unhandled software interrupt!");
            break;
    }

}