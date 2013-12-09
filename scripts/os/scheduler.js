/**
 * User: nick
 * Date: 11/5/13
 */

function Scheduler()
{
    //fields
    this.cycles     =   0;          // the number of cycles executed since the last context switch

    //methods

    // Update the ready queue
    this.update = function()
    {
        // Allow anything that's already running to continue
        if (_CPU.isExecuting)
        {
            //the actual work is done
            _CPU.cycle();
            //keep track of how far in to this quantum you are
            this.cycles++;
            //Check if you need to do a context switch
            if (this.cycles > _Quantum && _ReadyQueue.getSize() > 0)
            {   //true when you have exceeded the cycles in this quantum and there are more items on the ready queue

                //put an SWI on the interrupt queue to trigger a context switch
                _KernelInterruptQueue.enqueue( new Interrupt(SOFTWARE_IRQ, SOFT_IRQ_CODES[3]) );
            }
        }
        //if there were no threads in execution, check if there's anything on the ready queue
        else if (_ReadyQueue.getSize() > 0 )
        {
            _CurrentThread = _ReadyQueue.peek();
            if (_CurrentThread)
            {
                _CurrentThread.state = "RUNNING";
                _CPU.update(_CurrentThread);
                _CPU.isExecuting = true;
            }
        }
    };

    //for resetting the cycles, called on context switches
    this.resetCycles = function()
    {
        this.cycles = 0;
    };
}
