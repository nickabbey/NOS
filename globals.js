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

var HDD_IRQ = 3;    // irq for disk I/O

var MAX_TRHEADS = 4;  //the maximum number of threads allowed in the ready queue at any given time

//software IRQ code. Use their indices when raising opcodes
// IE) _KernelInterruptQueue.enqueue( new Interrupt(SOFTWARE_IRQ, SOFT_IRQ_CODES[0]) );
var SOFT_IRQ_CODES = [  "OP_INV"    ,   // 0 = invalid opcode
                        "MEM_OOB"   ,   // 1 = memory out of bounds - shouldn't be possible, see cpu.translateAddress()
                        "MEM_TRF"   ,   // 2 = memory translation failure
                        "CTX_SWP"   ];   // 3 = context switch

//Hard Drive ISR codes.  Use their indices when parsing disk operations
var HDD_IRQ_CODES = [   "FORMAT"    ,   //0
                        "CREATE"    ,   //1
                        "DELETE"    ,   //2
                        "LIST"      ,   //3
                        "READ"      ,   //4
                        "WRITE"     ];  //5

var SCHEDULER_ALGORITHMS = [    "rr",       //0 - default
                                "fcfs",     //1 - RR with high quantum
                                "priority"];//2 - priority non-preemptive

var CURRENT_SCHEDULER_ALGORITHM = SCHEDULER_ALGORITHMS[0];  //RR is the default
//
// Global Variables
//
var _CPU = null;

var _Scheduler = null;  // a reference to our CPU scheduler

var _ReadyQueue = null; // FIFO queue - short term scheduler

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

//The File System display in index.html
var _FsTable = null;

//List of processes as an array
var _NextPID = 0;

//A reference to whichever thread is currently being executed by the CPU
var _CurrentThread = null;

//Long term scheduler - array of PCB's
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


//an array to store logical hard drives (I'll allow for mounting/cloning disks later to allow offline hdd storage)
var _HddList = [];

//a reference to the file system in use
var _FS = null;

var _FS_INVALID_CHARS    = "\\\'\"\n\b\r\f\t"; //The initial list of characters forbidden in file names

//virtual hdd "physical" specs
var HDD_NUM_TRACKS  = 4;
var HDD_NUM_SECTORS = 8;
var HDD_NUM_BLOCKS  = 8;
var HDD_BLOCK_SIZE  = 64;

//file system meta data for mbr - hex values as strings from 00 to (tracks*sectors*block*blocksize === 16384)
//this requires 2 blocks to store hex values from 0000 to FFFF or "00.00" to "FF.FF"
var HDD_MAX_FILE_BLOCKS     = null;
var HDD_USED_FILE_BLOCKS    = null;
var HDD_FREE_FILE_BLOCKS    = null;

var HDD_MAX_FAT_BLOCKS      = null;
var HDD_USED_FAT_BLOCKS     = null;
var HDD_FREE_FAT_BLOCKS     = null;

var FS_META_BITS        = null; //number of bits used to store fs metadata
var FS_NEXT_FREE_FILE_BLOCK  = null; //tsb address of the next free block for data
var FS_NEXT_FREE_FAT_BLOCK  = null; //tsb address of the next free block for file information

var FS_FILENAMES    = null;   //a list of the filenames in use by the system

//address of mbr "t.s.b"
var HDD_MBR_ADDRESS     = null;  //tsb address of the main boot record, specified by file system driver init routine

var FS_ACTIVE_HDD = null;





