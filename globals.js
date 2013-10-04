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


//
// Global Variables
//
var _CPU = null;

var _OSclock = 0;       // Page 23.

var _Mode = 0;   // 0 = Kernel Mode, 1 = User Mode.  See page 21.

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

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;

// Global Device Driver Objects - page 12
var krnKeyboardDriver = null;

// For testing...
var _GLaDOS = null;
var _Testing = false;

// For testing...
var _GLaDNOS = null;

//The total "memory" "installed" in this system
var _InstalledMemory = 768;

// how big each segment will be
var _MemorySegmentSize = 256;

//The actual main memory of our host
var _MainMemory = null;

//The memory display in index.html
var _MemoryTable = null;

