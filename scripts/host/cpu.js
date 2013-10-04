/* ------------  
   CPU.js

   Requires global.js.
   
   Routines for the host CPU simulation, NOT for the OS itself.  
   In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
   that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
   JavaScript in both the host and client environments.

   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

function Cpu()
{
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
    this.isExecuting = false;
    
    this.init = function()
    {
        this.PC    = 0;
        this.Acc   = 0;
        this.Xreg  = 0;
        this.Yreg  = 0;
        this.Zflag = 0;      
        this.isExecuting = false;  
    };
    
    this.cycle = function()
    {
        krnTrace("CPU cycle");
        // TODO: Accumulate CPU usage and profiling statistics here.
        // Do the real work here. Be sure to set this.isExecuting appropriately.
    };

    this.execute = function(opCode)
    {
        switch(opCode)
        {
            case "A9":
                accLoadConst = function()
                {
                    //TODO - Implement opcode A9
                };
                break;

            case "AD":
                accLoadMem = function()
                {
                    //TODO - Implement opcode AD
                };
                break;

            case "8D":
                accWriteMem = function()
                {
                    //TODO - Implement opcode 8D
                };
                break;

            case "6D":
                addWithCarry = function()
                {
                    //TODO - Implement opcode 6D
                };
                break;

            case "A2":
                xLoadConst = function()
                {
                    //TODO - Implement opcode A2
                };
                break;

            case "AE":
                xLoadMem = function()
                {
                    //TODO - Implement opcode AE
                };
                break;

            case "A0":
                yLoadConst = function()
                {
                    //TODO - Implement opcode A0
                };
                break;

            case "AC":
                yLoadMem = function()
                {
                    //TODO - Implement opcode AC
                };
                break;

            case "EA":
                noOp = function()
                {
                    //TODO - Implement opcode EA
                };
                break;

            case "00":
                sysBreak = function()
                {
                    //TODO - Implement opcode 00
                };
                break;

            case "EC":
                xCompare = function()
                {
                    //TODO - Implement opcode EC
                };
                break;

            case "D0":
                xBranch = function()
                {
                    //TODO - Implement opcode D0
                };
                break;

            case "EE":
                byteIncrement = function()
                {
                    //TODO - Implement opcode EE
                };
                break;

            case "FF":
                sysCall = function()
                {
                    //TODO - Implement opcode FF
                };
                break;

            default:
                sysBreak();
                break;
        }
    };
}