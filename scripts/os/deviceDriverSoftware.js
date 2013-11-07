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
//reference:  var SOFT_IRQ_CODES = ["OP_INV", "MEM_OOB", "MEM_TRF", "CTX_SWP"];
{
    switch (params)
    {
        case "OP_INV":
            krnTrace(this + "Invalid Opcode detected");
            krnKillProgram(_CurrentThread.pid.toString());
            break;
        case "MEM_OOB":
            krnTrace(this + "Memory Access Out Of Bounds!");
            krnKillProgram(_CurrentThread.pid.toString());
            break;
        case "MEM_TRF":
            krnTrace(this + "Memory Translation Failure!");
            krnKillProgram(_CurrentThread.pid.toString());
            break;
        case "CTX_SWP":
            krnTrace(this + "Context Swap Initiated!");
            krnContextSwitch();
            break;
        default:
            krnTrace(this + "Unhandled software interrupt!");
            break;
    }

}