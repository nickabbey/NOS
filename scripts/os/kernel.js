/* ------------
   Kernel.js
   
   Requires globals.js
   
   Routines for the Operating System, NOT the host.
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */


//
// OS Startup and Shutdown Routines   
//
function krnBootstrap()      // Page 8.
{
   hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

   // Initialize our global queues.
   _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
   _KernelBuffers = [];                  // Buffers... for the kernel.
   _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.
   _Console = new CLIconsole();          // The command line interface / console I/O device.

   // Initialize the CLIconsole.
   _Console.init();

   // Initialize standard input and output to the _Console.
   _StdIn  = _Console;
   _StdOut = _Console;

   // Load the Keyboard Device Driver
   krnTrace("Loading the keyboard device driver.");
   krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.  TODO: Should that have a _global-style name?
   krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
   krnTrace(krnKeyboardDriver.status);

    //Load the Software Interrupt Driver
    krnTrace("Loading Software Interrupt Driver");
    krnSoftwareInterruptDriver = new DeviceDriverSoftware();
    krnSoftwareInterruptDriver.driverEntry();
    krnTrace(krnSoftwareInterruptDriver.status);

   // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
   krnTrace("Enabling the interrupts.");
   krnEnableInterrupts();

   // Launch the shell.
   krnTrace("Creating and Launching the shell.");
   _OsShell = new Shell();
   _OsShell.init();

   // Finally, initiate testing.
   if (_GLaDOS) {
      _GLaDOS.afterStartup();
   }

    if (_GLaDNOS) {
        _GLaDNOS.afterStartup();
    }
}

function krnShutdown()
{
    krnTrace("begin shutdown OS");
    // TODO: Check for running processes.  Alert if there are some, alert and stop.  Else...    
    // ... Disable the Interrupts.
    krnTrace("Disabling the interrupts.");
    krnDisableInterrupts();
    // 
    // Unload the Device Drivers?
    // More?
    //
    krnTrace("end shutdown OS");
}


function krnOnCPUClockPulse() 
{
    /* This gets called from the host hardware sim every time there is a hardware clock pulse.
       This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
       This, on the other hand, is the clock pulse from the hardware (or host) that tells the kernel 
       that it has to look for interrupts and process them if it finds any.                           */

    //Check if we're idle first
    if (_KernelInterruptQueue.getSize() === 0 && (!_CurrentThread || _CurrentThread.state ==="SUSPENDED"))
    {
        krnTrace("Idle");
    }
    else if(_KernelInterruptQueue.getSize() === 0 && _CurrentThread.state ==="TERMINATED")
    {
        //tostring is counter-intuitive, until you realize that the shell works with strings and the kernel doesn't
        krnKillProgram(shellPIDcheck(_CurrentThread.pid.toString()));
    }
    //Otherwise, triage the work to be done on this pulse
    else
    {
        // First, check for an interrupt, are any. Page 560
        if (_KernelInterruptQueue.getSize() > 0)
        {
            // Process the first interrupt on the interrupt queue.
            var interrupt = _KernelInterruptQueue.dequeue();
            krnInterruptHandler(interrupt.irq, interrupt.params);
        }
        // Next, check for an active thread that needs cpu time
        //TODO this will have to change when preemptive threading or cpu scheduling are added
        else if (_CurrentThread)
        {
            _CPU.cycle();
            //there might not always be a current thread after a cycle, but if so it needs to be updated
            if(_CurrentThread)
            {
                _CurrentThread.update();
            }
        }
    }

    //This is done in lots of places where it may be desirable to see an immediate update to host status
    //Doing it here may be slightly redundant, but ensures that the displays are always accurate after a pulse
    updateDisplayTables();
}


// 
// Interrupt Handling
// 
function krnEnableInterrupts()
{
    // Keyboard
    hostEnableKeyboardInterrupt();
    // Put more here.
}

function krnDisableInterrupts()
{
    // Keyboard
    hostDisableKeyboardInterrupt();
    // Put more here.
}

function krnInterruptHandler(irq, params)    // This is the Interrupt Handler Routine.  Pages 8 and 560.
{
    // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on.  Page 766.
    krnTrace("Handling IRQ~" + irq);

    // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
    // TODO: Consider using an Interrupt Vector in the future.
    // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.  
    //       Maybe the hardware simulation will grow to support/require that in the future.
    switch (irq)
    {
        case TIMER_IRQ: 
            krnTimerISR();                   // Kernel built-in routine for timers (not the clock).
            break;
        case KEYBOARD_IRQ: 
            krnKeyboardDriver.isr(params);   // Kernel mode device driver
            _StdIn.handleInput();
            break;
        case SOFTWARE_IRQ:                  //  Software Interrupt (SWI) driver
            krnSoftwareInterruptDriver.isr(params);
            break;
        default: 
            krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
    }
}

function krnTimerISR()  // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver).
{
    // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
}

//
// OS Utility Routines
//
function krnTrace(msg)
{
   // Check globals to see if trace is set ON.  If so, then (maybe) log the message. 
   if (_Trace)
   {
      if (msg === "Idle")
      {
         // We can't log every idle clock pulse because it would lag the browser very quickly.
         if (_OSclock % 10 == 0)  // Check the CPU_CLOCK_INTERVAL in globals.js for an 
         {                        // idea of the tick rate and adjust this line accordingly.
            hostLog(msg, "OS");
         }         
      }
      else
      {
       hostLog(msg, "OS");
      }
   }
}
   
function krnTrapError(msg)
{
    hostLog("OS ERROR - TRAP: " + msg);
    _StdIn.bsod();
    krnShutdown();
    clearInterval(_hardwareClockID);
}

//Kills a process, param is a process ID
//Called by shell, does no error checking (this is the shell's responsibility)
//Called by kernel to do process cleanup on clock pulse (Only when a process with a valid id is done running)
function krnKillProgram(param)
{
   //the thread that we will kill
    var thread = _ThreadList[param];

    //first, clean up memory for the partition holding this thread
    _MMU.flushPartition(thread.base / _MemorySegmentSize );

    //next, set CPU.isExecuting false
    _CPU.isExecuting = false;

    //finally, remove the PCB from the ready queue
    _ThreadList.splice(_ThreadList.indexOf(thread), 1);

    //so the krnOnClockPulse
    _CurrentThread = null;
}
