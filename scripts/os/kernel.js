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
   _KernelInterruptQueue = new Queue(); // A (currently) non-priority queue for interrupt requests (IRQs).
   _KernelBuffers = [];                 // Buffers... for the kernel.
   _KernelInputQueue = new Queue();     // Where device input lands before being processed out somewhere.
   _ReadyQueue = new Queue();           // The ready queue
   _Console = new CLIconsole();         // The command line interface / console I/O device.

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

    //load the HDD Device Driver
    krnTrace("Loading Hard Disk Controller");
    krnHddDriver = new DeviceDriverHDD();
    krnHddDriver.driverEntry();
    krnTrace(krnHddDriver.status);

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

    if (_KernelInterruptQueue.getSize() > 0)
    {
        var interrupt = _KernelInterruptQueue.dequeue();
        krnInterruptHandler(interrupt.irq, interrupt.params);
    }
    else if (_CPU.isExecuting || _ReadyQueue.getSize() > 0)
    {
        _Scheduler.update();
    }
    else // If there are no interrupts and there is nothing being executed then just be idle.
    {
//        krnTrace("Idle");
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
            krnTimerISR();                  // Kernel built-in routine for timers (not the clock).
            break;
        case KEYBOARD_IRQ: 
            krnKeyboardDriver.isr(params);  // Kernel mode device driver for Keyboard
            _StdIn.handleInput();
            break;
        case SOFTWARE_IRQ:                  //  Kernem mode device driver for Software Interrupts (SWI)
            krnSoftwareInterruptDriver.isr(params);
            break;
        case HDD_IRQ:                       //Kernel mode device driver for Hard Disk Drive
            krnHddDriver.isr(params);
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

    //first, set CPU.isExecuting false
    _CPU.isExecuting = false;

    //then, clean up memory for the partition holding this thread
    _MMU.flushPartition(thread.base / _MemorySegmentSize );

    //next, clean up any swap files for this thread
    for (var i = 0; i < FS_FILENAMES.length; i++)
    {   //start by looping through the list for filenames in the FAT

        //look for a match of the current pid swap file name to a file on disk
        if(FS_FILENAMES[i][1] === _MMU.makeSwapId(thread.pid))
        {
            //make note of it
            var filename = FS_FILENAMES[i][1];
        }
    }

    //when there was a swap file found, delete it
    if (filename)
    {
        krnDeleteFile([HDD_IRQ_CODES[2],filename,null]);
    }

    //now, remove the PCB from the _ThreadList
    _ThreadList.splice(_ThreadList.indexOf(thread), 1);

    //and the ready queue
    _ReadyQueue.dequeue();

    //and set the current thread to null so the CPU scheduler will know that it can assign a new thread
    _CurrentThread = null;
}

//does the actual work of switching contexts when the SWI for context switch is encountered
function krnContextSwitch()
{
    var didRollIn = true;

    if (!_CurrentThread)
    {
        krnTrace(this + "Context switch failed: no active thread!");
        return;
    }
    else
    {
        krnTrace(this + "Context switch set process " + _CurrentThread.pid + " to state 'READY'.");
        _CurrentThread.state = "READY";
        _CurrentThread.update();

        //move the current thread to the back of the ready queue
        var nextThread = _ReadyQueue.dequeue();
        _ReadyQueue.enqueue(nextThread);

        //and roll in the new head of the ready queue
        nextThread = _ReadyQueue.peek();

        //when the next thread is on disk, it needs to be rolled in from memory
        if (nextThread.location === -1)
        {
            didRollIn = _MMU.rollIn(nextThread);
        }

        if (didRollIn)
        {
            //update the current thread to the one at the front of the ready queue
            _CurrentThread = nextThread;


            _CurrentThread.state = "RUNNING";
            krnTrace(this + "Context switch set process " + _CurrentThread.pid + " to state 'running'.");

            _CPU.update(_CurrentThread);

            _Scheduler.resetCycles();
        }
        else
        {
            _CurrentThread = _ReadyQueue.dequeue();
            krnTrace(this + "Context switch failed to roll in " + _CurrentThread.pid);
            _StdOut.putLine("Failed to roll in process " + _CurrentThread.pid + ". Killing and cleaning up.");
            krnKillProgram(_CurrentThread.pid);
        }
    }
}

function krnRunAll() {
    for (var i = 0; i < MAX_TRHEADS; i++)
    {
        if (_ThreadList[i])
        {
            _ThreadList[i].state = "READY";
            _ReadyQueue.enqueue(_ThreadList[i]);
        }
    }
}

function krnFormatDisk(params)
{
    //put a disk I/O interrupt on the queue
    _KernelInterruptQueue.enqueue( new Interrupt(HDD_IRQ, [params]) );
}

function krnCreateFile(params)
{
    var retVal = false;
    if (_FS.isFree)
    {
        //put a disk I/O interrupt on the queue
        retVal = true;
        _KernelInterruptQueue.enqueue( new Interrupt(HDD_IRQ, [params]) );
    }
    else
    {
        _StdOut.putLine("ERROR: Attempted file creation on an unformatted disk");
    }

    return retVal;
}

function krnDeleteFile(params)
{
    var retVal = false;
    if (_FS.isFree)
    {
        //put a disk I/O interrupt on the queue
        retVal = true;
        _KernelInterruptQueue.enqueue( new Interrupt(HDD_IRQ, [params]) );
    }
    else
    {
        _StdOut.putLine("ERROR: Attempted file delete on an unformatted disk");
    }
    return retVal;
}

function krnListFiles(params)
{
    var retVal = false;
    if (_FS.isFree)
    {
        //put a disk I/O interrupt on the queue
        retVal = true;
        _KernelInterruptQueue.enqueue( new Interrupt(HDD_IRQ, [params]) );
    }
    else
    {
        _StdOut.putLine("ERROR: Attempted list files on an unformatted disk");
    }
    return retVal;
}

function krnWriteFile(params)
{
    var retVal = false;
    if (_FS.isFree)
    {
        //put a disk I/O interrupt on the queue
        retVal = true;
        _KernelInterruptQueue.enqueue( new Interrupt(HDD_IRQ, [params]) );
    }
    else
    {
        _StdOut.putLine("ERROR: Attempted file write on an unformatted disk");
    }
    return retVal;
}

function krnReadFile(params)
{
    var retVal = false;
    if (_FS.isFree)
    {
        //put a disk I/O interrupt on the queue
        retVal = true;
        _KernelInterruptQueue.enqueue( new Interrupt(HDD_IRQ, [params]) );
    }
    else
    {
        _StdOut.putLine("ERROR: Attempted file read on an unformatted disk");
    }
    return retVal;
}

