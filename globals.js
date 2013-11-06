/* ------------  
   Globals.js

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global CONSTANTS
//
var APP_NAME = "NOS";  // NickOS, AKA NOS AKA Nitrous.  Fast?  Laughing gas?  Both?  You decide.
var APP_VERSION = "0.42";   // "The Answer to the Ultimate Question of Life, the Universe, and Everything."  Duh!

var CPU_CLOCK_INTERVAL = 100;   // This is in ms, or milliseconds, so 1000 = 1 second.

var TIMER_IRQ = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
                    // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
var KEYBOARD_IRQ = 1;

var SOFTWARE_IRQ = 2;  //  Software IRQ (for things like invlaid opcodes, memory access violations, etc)

//software IRQ code. Use their indices when raising opcodes
// IE) _KernelInterruptQueue.enqueue( new Interrupt(SOFTWARE_IRQ, SOFT_IRQ_CODES[0]) );
var SOFT_IRQ_CODES = [  "OP_INV"    ,   // 0 = invalid opcode
                        "MEM_OOB"   ,   // 1 = memory out of bounds - shouldn't be possible, see cpu.translateAddress()
                        "MEM_TRF"   ,   // 2 = memory translation failure
                        "CTX_SWP"   ]   // 3 = context switch

//
// Global Variables
//
var _CPU = null;

var _Scheduler = null;  // a reference to our CPU scheduler

var _Quantum = 6;  // reference to our RR Quantum (Default = 6 cycles)

var _OSclock = 0;       // Page 23.

var _Canvas = null;               // Initialized in hostInit().
var _DrawingContext = null;       // Initialized in hostInit().

//for changes to console IO
var _FontName = "monospace";  //new consoleIO system requires a monospace font.
var _FontPoint = 10;         //any size will work, use something reasonable in relation to canvas dimensions

// Default the OS trace to be on.
var _Trace = true;

// OS queues
var _KernelInterruptQueue = null;
var _KernelBuffers = null;
var _KernelInputQueue = null;

// Standard input and output
var _StdIn  = null;
var _StdOut = null;

// UI
var _Console = null;
var _OsShell = null;
var _Cursor = false;
//var _CursorBlinkInterval= 0;  //cursor blink interval set in init //TODO make this actually work

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;

// Global Device Driver Objects - page 12
var krnKeyboardDriver = null;

//  Software interrupt driver
var krnSoftwareInterruptDriver = null;


// For testing...
var _GLaDOS = null;     //Alan's test routines
var _Testing = false;

// For testing...
var _GLaDNOS = null;    //My test routines

//The total "memory" "installed" in this system
//Should always be a multiple of the _MemorySegmentSize
var _InstalledMemory = 768;
//var _InstalledMemory = 256;

// how big each memory partition will be
var _MemorySegmentSize = 256;

//The actual main memory of our host
var _MainMemory = null;

//the memory manager
var _MMU = null;

//The memory display in index.html
var _MemoryTable = null;

//The CPU table display in index.html
var _CpuTable = null;

//The PCB display in index.html
var _PcbTable = null;

//List of processes as an array
var _NextPID = 0;

//A reference to whichever thread is currently being executed by the CPU
var _CurrentThread = null;

//array of PCB's
var _ThreadList = [];

// a reference to easily access the status bar
var _StatusBar = null;

//CPU stepping on/off toggle
var _StepStatus = false;

//for accessing the text input box
var _UserProgramText = "";

//the end state of the last completed thread
var _LastPCB = null;

//The first program, for easy population of user program box and program testing
var _ProgramOne = "A9 03 8D 41 00 A9 01 8D 40 00 AC 40 00 A2 01 FF EE 40 00 AE 40 00 EC 41 00 D0 " +
    "EF A9 44 8D 42 00 A9 4F 8D 43 00 A9 4E 8D 44 00 A9 45 8D 45 00 A9 00 8D 46 00 " +
    "A2 02 A0 42 FF 00";

var _ProgramTwo = "A9 00 8D 00 00 A9 00 8D 3B 00 A9 01 8D 3B 00 A9 00 8D 3C 00 A9 02 8D 3C 00 A9 01 " +
    "6D 3B 00 8D 3B 00 A9 03 6D 3C 00 8D 3C 00 AC 3B 00 A2 01 FF A0 3D A2 02 FF AC 3C 00 A2 01 FF 00 " +
    "00 00 20 61 6E 64 20 00";

var _ProgramThree = "A9 00 8D 00 00 A9 00 8D 4B 00 A9 00 8D 4B 00 A2 03 EC 4B 00 D0 07 A2 01 EC 00 00 " +
    "D0 05 A2 00 EC 00 00 D0 26 A0 4C A2 02 FF AC 4B 00 A2 01 FF A9 01 6D 4B 00 8D 4B 00 A2 02 EC 4B 00 " +
    "D0 05 A0 55 A2 02 FF A2 01 EC 00 00 D0 C5 00 00 63 6F 75 6E 74 69 6E 67 00 68 65 6C 6C 6F 20 77 6F 72 6C 64 00";

//various incarnations of testing programs for individual opcodes
//var _TestProg = "A9 A2 8D 30 00 A9 FF 8D 31 00 D0 24";
//var _TestProg = "A9 FF 8D 30 00 EE 30 00 EE 30 00"
//var _TestProg = "A9 41 8D 30 00 A9 42 8D 31 00 A9 43 8D 32 00 A0 30 A2 02 FF A9 EE";
