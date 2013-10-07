/**
 * Date: 9/8/13
 * Time: 2:14 PM
 */


//
// gladnos.js - It's for testing. And enrichment.
//

function GladNos() {
    this.version = 42;

    this.init = function() {
        //var msg = "Hello [subject name here]. It's time for testing.\n";
        //msg += "Before we start, however, keep in mind that although fun and learning are our primary goals, serious injuries may occur.";
        // alert(msg);

        _UserProgramText.value = _TestProg;
    };

    this.afterStartup = function() {



         // Execute the 'load' and 'run' commands.
         _KernelInputQueue.enqueue('l');
         _KernelInputQueue.enqueue('o');
         _KernelInputQueue.enqueue('a');
         _KernelInputQueue.enqueue('d');
         krnInterruptHandler(KEYBOARD_IRQ, [13, false]);

        // Execute the 'load' and 'run' commands.
        _KernelInputQueue.enqueue('r');
        _KernelInputQueue.enqueue('u');
        _KernelInputQueue.enqueue('n');
        krnInterruptHandler(KEYBOARD_IRQ, [13, false]);

        /*
         // Execute the 'ver' command.
         _KernelInputQueue.enqueue('q');
         _KernelInputQueue.enqueue('o');
         _KernelInputQueue.enqueue('r');
         krnInterruptHandler(KEYBOARD_IRQ, [13, false]);

         // Execute the 'help' command.
         _KernelInputQueue.enqueue('h');
         _KernelInputQueue.enqueue('e');
         _KernelInputQueue.enqueue('l');
         _KernelInputQueue.enqueue('p');
         krnInterruptHandler(KEYBOARD_IRQ, [13, false]);

         // Load some user program code.
         document.getElementById("taProgramInput").value="A9 07 8D 00 00 FF 00";

         // Execute the 'load' command.
         _KernelInputQueue.enqueue('l');
         _KernelInputQueue.enqueue('o');
         _KernelInputQueue.enqueue('a');
         _KernelInputQueue.enqueue('d');
         krnInterruptHandler(KEYBOARD_IRQ, [13, false]);
         // */
    };
}
