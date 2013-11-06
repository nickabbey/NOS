/**
 * User: nick
 * Date: 11/5/13
 */

function Scheduler()
{
    //fields
    this.quantum    =   _Quantum;   // specified by default in globals, or on the command line at run time
    this.cycles     =   0;          // for tracking the number of cycles in each quantum

    //methods
    this.contextSwitch  = function()
    {

    };
}
