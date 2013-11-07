/**
 * User: nick
 * Date: 11/5/13
 */

function Scheduler()
{
    //fields
    this.cycles     =   0;          // the number of cycles executed since the last context switch

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

    this.check = function()
    {
        if (_CPU.isExecuting)
        {
            _CPU.cycle();
            //TODO - context switch here?
        }
        else if (_ReadyQueue.getSize() > 0 )
        {
            var index = _ReadyQueue.dequeue();
            index = shellGetPidIndex(index.pid.toString());
            _CurrentThread = _ThreadList[index];
            _CurrentThread.state = "RUNNING";
            _CPU.update(_CurrentThread);
            _CPU.isExecuting = true;
        }
    };
}
