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
        //TODO - if there is space in the ready queue, something from the thread list
        //if there were no threads in execution, check if there's anything on the ready queue
        else if (_ReadyQueue.getSize() > 0 )
        {
            //get the head of the rq
            var index = _ReadyQueue.dequeue();
            //figure out where in the list of loaded threads this pcb is
            //TODO the scheduler shouldn't be interacting with the shell, fix this in the future
            index = shellGetPidIndex(index.pid.toString());
            //make the popped pcs the current thread of execution
            _CurrentThread = _ThreadList[index];
            _CurrentThread.state = "RUNNING";
            _CPU.update(_CurrentThread);
            _CPU.isExecuting = true;
        }
//        //keep the ready queue full
//        else if (_ThreadList.getSize() > 0 && _ReadyQueue.getSize() < MAX_TRHEADS)
//        {
//
//        }
    };

    //for resetting the cycles, called on context switches
    this.resetCycles = function()
    {
        this.cycles = 0;
    };
}
