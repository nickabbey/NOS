/* ------------  
   Control.js

   Requires global.js.
   
   Routines for the hardware simulation, NOT for our client OS itself. In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code that
   hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using JavaScript in 
   both the host and client environments.
   
   This (and other host/simulation scripts) is the only place that we should see "web" code, like 
   DOM manipulation and JavaScript event handling, and so on.  (Index.html is the only place for markup.)
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */


//
// Control Services
//
function hostInit()
{
	// Get a global reference to the canvas.  TODO: Move this stuff into a Display Device Driver, maybe?
	_Canvas  = document.getElementById('display');

	// Get a global reference to the drawing context.
	_DrawingContext = _Canvas.getContext('2d');

    //***DEPRECATED******  Console does all and more this now
    //CanvasTextFunctions.enable(_DrawingContext);

	// Clear the log text box.
	document.getElementById("taLog").value="";

    //initialize the host memory
    _MainMemory = new Memory();

    //create an mmu
    _MMU = new Mmu();


    //Get a reference to the memory table for output
    _MemoryTable = document.getElementById("taMemory");

    _MemoryTable.appendChild(memoryToTable());

    //Get a reference to the CPU table for output
    _CpuTable = document.getElementById("taCPU");

    _CpuTable.appendChild(cpuToTable());

    //Get a reference to the PCB table for output
    _PcbTable = document.getElementById("taPCB");

    //old version, shows the PCB contents for active thread
    //_PcbTable.appendChild(pcbToTable());

    //new version, shows the PCBs in the ready queue
    _PcbTable.appendChild(readyQueueToTable());

    _UserProgramText = document.getElementById("taProgramInput");

    //For testing programs
    _UserProgramText.value = _ProgramOne;


	// Set focus on the start button.
   document.getElementById("btnStartOS").focus();

    //Give some status info
    _StatusBar = document.getElementById("taStatusBar");
    _StatusBar.value = new Date().toString();

   // Check for our testing and enrichment core.
//   if (typeof _GLaDOS === "function")
//   {
       //Interpreter will see this as an unresolved type if alan's test script isn't enabled in index.html
//      _GLaDOS = new Glados();
//       alert("ALERT! - Changes to console IO don't play nice with GlaDOS. " +
//           "The script executes, but this disables keyboard input! " +
//            "Luckily, you can purge the Neurotoxins after the script has run. " +
//            "Just click the 'Purge' button when you want to regain control");
//      _GLaDOS.init();
//      _Testing = true;
//   }

//    // Personal testing
//    if (typeof _GLaDNOS === "function")
//    {
//        _GLaDNOS = new GladNos();
//        _GLaDNOS.init();
//        _Testing = true;
//    }

    //stepping options should not be selectable until start is clicked
    document.getElementById("chkStep").disabled = true;
    document.getElementById("btnStep").disabled = true;
}

function hostLog(msg, source)
{
    // Check the source.
    if (!source) {
        source = "?";
    }

    // Note the OS CLOCK.
    var clock = _OSclock;

    // Note the REAL clock in milliseconds since January 1, 1970.
    var now = new Date().getTime();

    // Build the log string.   
    var str = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now  + " })"  + "\n";

    // Update the log console.
    var taLog = document.getElementById("taLog");
    taLog.value = str + taLog.value;
    // Optionally update a log database or some streaming service.
}

function hostStat(status)  //sends a message to the host status bar
{
    var taStatus = document.getElementById("taStatusBar");
    var msg = "This is one UGLY error!";
    //update the message
    if(status) {
        msg = status;
        taStatus.value = msg;
    }
}


//
// Control Events
//
function hostBtnStartOS_click(btn)
{
    // Disable the start button...
    btn.disabled = true;
    
    // .. enable the Halt and Reset buttons ...
    document.getElementById("btnHaltOS").disabled = false;
    document.getElementById("btnReset").disabled = false;

    //set initial stepping checkbox and button state
    document.getElementById("chkStep").disabled = false;
    document.getElementById("btnStep").disabled = true;

    if(_Testing)
    {
        document.getElementById("btnPurge").disabled = false;
    }
    else
    {
        document.getElementById("btnPurge").disabled = true;
    }
    //Status update
    document.getElementById("taStatusBar").value = "KERNEL SPAAAAAAAAACCEEE GHOOOOOSSSSSSTTT!!!!";
    
    // .. set focus on the OS console display ... 
    document.getElementById("display").focus();
    
    // ... Create and initialize the CPU ...
    _CPU = new Cpu();
    _CPU.init();

    //Create the CPU scheduler
    _Scheduler = new Scheduler();

    //initialize the MMU
    _MMU.init();

    // ... then set the host clock pulse ...
    _hardwareClockID = setInterval(hostClockPulse, CPU_CLOCK_INTERVAL);
    //_CursorBlinkInterval = setInterval(cursorBlink, 1000);

    // .. and call the OS Kernel Bootstrap routine.
    krnBootstrap();
}

function hostBtnHaltOS_click(btn)
{
    hostLog("emergency halt", "host");
    hostLog("Attempting Kernel shutdown.", "host");

//    //stop the cursor pulse
//    _Console.clearCursorBlinkInterval();
    // Call the OS shutdown routine.
    krnShutdown();
    // Stop the JavaScript interval that's simulating our clock pulse.
    clearInterval(_hardwareClockID);
//    _Console.clearCursorBlinkInterval();

    // TODO: Is there anything else we need to do here?
}

function hostBtnReset_click(btn)
{
    // The easiest and most thorough way to do this is to reload (not refresh) the document.
    location.reload();
    // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
    // be reloaded from the server. If it is false or not specified, the browser may reload the 
    // page from its cache, which is not what we want.
}

function hostBtnPurge_click(btn)
{    //Disable _Testing so that we can have an interactive session
    _Testing = false;
    //refocus on the console
    hostStat("Cleared the air.");
    document.getElementById("display").focus();
}

//turn CPU stepping on and off
function hostChkStep()
{
    //when the checkmark is clicked, set _StepStatus to value of checkbox and enable step button
    if (document.getElementById("chkStep").checked == true)
    {
        _StepStatus = true;
        document.getElementById("btnStep").disabled = false;
        document.getElementById("btnStep").addEventListener("onclick", hostBtnStepClick());
    }
    //otherwise, set it false and disable the button
    else
    {
        _StepStatus = false;
        document.getElementById("btnStep").disabled = true;
        document.getElementById("btnStep").removeEventListener("onclick", hostBtnStepClick());
    }
}

//Takes appropriate action when a click is registered on the Step button
//SHOULD only be possible to click when chkStep is checked
function hostBtnStepClick()
{
    //The cpu is initialized and there is a current thread
    if(_CPU && _CurrentThread)
    {
        //set process and cpu state
        _CurrentThread.state = "RUNNING";
        _CPU.isExecuting = true;
        krnTrace("Single step request processed");
    }
    //The cpu is initialized but there is no current thread
    else if (_CPU && !_CurrentThread)
    {
        _CPU.isExecuting = false;
        krnTrace("Single step request ignored (no current thread)");
    }

    updateDisplayTables();
}


