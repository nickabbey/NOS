/**
 * User: nick
 * Date: 11/5/13
 */

function Scheduler()
{
    //fields
    this.cycles     =   0;          // the number of cycles executed since the last context switch
    this.activeThread = false;

    //methods
    this.contextSwitch  = function()
    {
        //Raise SWI 3 = Context switch
        _KernelInterruptQueue.enqueue( new Interrupt(SOFTWARE_IRQ, SOFT_IRQ_CODES[3]) );
    };

    //task runs per cycle
    this.update = function()
    {
      this.cycles++;
        //more?
    };

    //evaluates PCB's in _ThreadList, updates _ReadyQueue as needed
    this.check = function()
    {
        //Loop through the threadlist
        for (var i = 0; i < _ThreadList.length; i++)
        {
            switch (_ThreadList[i].state)
            {

                case "LOADED":
                    if (this.activeThread)
                    {
                        _ThreadList[i].state = "WAITING";
                    }
                    else
                    {
                        _ThreadList[i].state = "READY";
                        _ReadyQueue.push(_ThreadList[i].pid);
                    }
                    break;

                case "READY":
                    if (!this.activeThread)
                    {
                        _ThreadList[i].state = "RUNNING";
                        _CurrentThread = _ThreadList[i];
                        this.activeThread = true;
                    }
                    break;

                case "WAITING":
                    if (!this.activeThread)
                    {
                        _ThreadList[i].state = "READY";
                        _ReadyQueue.push(_ThreadList[i].pid);
                    }
                    break;

                case "RUNNING":
                    _CPU.isExecuting = true;
                    break;

//                case "SUSPENDED":
//                    if (this.activeThread)
//                    {
//
//                    }
//                    else
//                    {
//
//                    }
//                    break;

                case "TERMINATED":
                    //can't change the length of _ThreadList while looping through it, so flag this thread for cleanup
//                        krnKillProgram(shellGetPidIndex(_ThreadList[i].pid.toString()));
                        this.activeThread = false;
                        _CurrentThread = null;
                    break;

                default:

                    break;

            }

      }
    };
}
