/**
 * User: nick
 * Date: 11/6/13
 * Time: 1:12 PM
 *
 * ReadyQueue.js
 *  The queue used by the CPU scheduler.  It's just a FIFO queue of PIDS waiting for CPU time
 */

function ReadyQueue()
{
    //fields
    this.rq     =   [];      //as it's core this queue is just an array

    //methods

    //undefined when this.rq is zero length
    this.peek = function()
    {
        if (this.rq.size > 0)
        {
            return this.rq[0];
        }
        else
        {
            return null;
        }

    };

    //push the param to the tail of the array
    this.push = function(param)
    {
        if (param != undefined)
        {
            this.rq[this.rq.length] = param;
        }
    };

    //pop the head of the array - returns undefined when this.rq is zero length
    this.pop = function()
    {
        return this.rq.shift();
    };
}
