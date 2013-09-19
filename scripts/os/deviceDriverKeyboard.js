/* ----------------------------------
   DeviceDriverKeyboard.js
   
   Requires deviceDriver.js
   Requires keymap.js
   
   The Kernel Keyboard Device Driver.
   ---------------------------------- */

DeviceDriverKeyboard.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverKeyboard()                     // Add or override specific attributes and method pointers.
{
    // "Constructor" code.
    // "subclass"-specific attributes.
    // this.buffer = "";    // TODO: Do we need this?
    // Override the base method pointers.
    this.driverEntry = krnKbdDriverEntry;
    this.isr = krnKbdDispatchKeyPress;
    this.keymap = new Keymap();  //allows for scancode magic
}

function krnKbdDriverEntry()
{
    // Initialization routine for this, the kernel-mode Keyboard Device Driver.
    this.status = "loaded";
    this.keymap.init(); //abracadabra
    // More?
}

function krnKbdDispatchKeyPress(params)
{
    // Parse the params.    TODO: Check that they are valid and osTrapError if not.
    var keyCode = params[0];
    var isShifted = params[1];
    krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
    //this ensures that you're sending a valid ascii code to the kernel input queue every time
    var asciiCode = this.keymap.fromScanCode(keyCode);
    if(isShifted)  //if your shifted
    {
        if(this.keymap.isShifty(keyCode))  //and your shifty
        {
            asciiCode = this.keymap.fromShiftedScanCode(keyCode);   //then get shift faced
        }
    } else if (this.keymap.isAlpha(keyCode))  // otherwise you're a lowercase, in which case you get an easy shift
    {
        asciiCode += 32;
    }
    //and put an ascii code on the input queue
    _KernelInputQueue.enqueue(asciiCode);
}